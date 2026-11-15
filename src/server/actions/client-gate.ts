/**
 * Request and verify the code that opens a client link (see `lib/link-gate.ts`).
 *
 * Both actions take the link token as a form field and re-run the full token authorisation before
 * touching a row — the same rule as every other public mutation: a token that does not authorise
 * this job can never issue or consume a code for it.
 */
"use server"

import { and, desc, eq, gt, isNull } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db/client"
import { jobs, linkCodes } from "@/db/schema"
import { requireStylist } from "@/lib/auth"
import { CODE_TTL_SECONDS, MAX_ATTEMPTS, codeMatches, gateCookieName, gateCookieValue, hashCode, newCode } from "@/lib/link-gate"
import { resendConfigured, sendEmail } from "@/lib/resend"
import { authorizeClientToken } from "@/server/queries/review"

function back(token: string, query: string): never {
  redirect(`/b/${token}${query}`)
}

/** Send a code to the address the studio has on the job. */
export async function requestClientCode(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "")
  const ctx = await authorizeClientToken(token)
  if (!ctx) back(token, "?err=link")
  if (!ctx.job.clientEmail) back(token, "?err=noemail")
  if (!resendConfigured()) back(token, "?err=mail")

  const recent = await db()
    .select({ id: linkCodes.id, createdAt: linkCodes.createdAt })
    .from(linkCodes)
    .where(and(eq(linkCodes.jobId, ctx.job.id), gt(linkCodes.createdAt, new Date(Date.now() - 60_000))))
    .limit(1)
  // one request a minute: enough for a real "it didn't arrive", useless for farming codes
  if (recent.length > 0) back(token, "?err=wait")

  const code = newCode()
  await db().insert(linkCodes).values({
    jobId: ctx.job.id,
    email: ctx.job.clientEmail,
    codeHash: hashCode(ctx.job.id, code),
    expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
  })

  await sendEmail({
    to: ctx.job.clientEmail,
    subject: `${code} — your Pull link for ${ctx.job.title}`,
    html:
      `<p>Enter this code to open your looks for <strong>${ctx.job.title}</strong>:</p>` +
      `<p style="font-size:28px;letter-spacing:6px;font-family:ui-monospace,monospace"><strong>${code}</strong></p>` +
      `<p>It expires in 10 minutes. If you did not ask for it, ignore this email — the link stays locked.</p>`,
    text: `Your Pull code for ${ctx.job.title}: ${code} (expires in 10 minutes)`,
  })

  back(token, "?sent=1")
}

/** Check the typed code and remember this device for the job. */
export async function verifyClientCode(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "")
  const typed = String(form.get("code") ?? "").trim()
  const ctx = await authorizeClientToken(token)
  if (!ctx) back(token, "?err=link")
  if (!/^\d{6}$/.test(typed)) back(token, "?err=code")

  const [latest] = await db()
    .select()
    .from(linkCodes)
    .where(and(eq(linkCodes.jobId, ctx.job.id), isNull(linkCodes.usedAt), gt(linkCodes.expiresAt, new Date())))
    .orderBy(desc(linkCodes.createdAt))
    .limit(1)

  if (!latest || latest.attempts >= MAX_ATTEMPTS) back(token, "?err=expired")

  if (!codeMatches(ctx.job.id, typed, latest.codeHash)) {
    await db().update(linkCodes).set({ attempts: latest.attempts + 1 }).where(eq(linkCodes.id, latest.id))
    back(token, "?err=code")
  }

  await db().update(linkCodes).set({ usedAt: new Date() }).where(eq(linkCodes.id, latest.id))
  ;(await cookies()).set(gateCookieName(ctx.job.id), gateCookieValue(ctx.job.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: `/b/${token}`,
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect(`/b/${token}`)
}

/** Studio-side switch: does the client link ask for the email code? */
export async function setClientVerifyForm(form: FormData): Promise<void> {
  const stylist = await requireStylist()
  const jobId = String(form.get("jobId") ?? "")
  const enabled = String(form.get("enabled") ?? "") === "1"
  if (!jobId) return

  await db()
    .update(jobs)
    .set({ clientVerify: enabled })
    .where(and(eq(jobs.id, jobId), eq(jobs.workspaceId, stylist.workspaceId)))

  redirect(`/studio/jobs/${jobId}`)
}
