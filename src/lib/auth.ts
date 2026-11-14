/**
 * Auth — two jobs, and only one of them is still ours.
 *
 * **Identity** belongs to Clerk: `getStylist()` reads the session, resolves the user and their
 * workspace through `lib/tenancy`, and every caller keeps working unchanged.
 *
 * **Links** stay ours: the client board (`/b/[token]`) and showroom intake (`/i/[token]`) are signed
 * with LINK_SECRET and verified here. They must never be Clerk-gated — a client never has an account.
 *
 * The magic-link session is gone: the cookie, the token and the allow-list check were the demo's
 * stand-in for identity, and Clerk replaced all three.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { redirect } from "next/navigation"
import { auth as clerkAuth, clerkClient } from "@clerk/nextjs/server"
import { env } from "./env"
import { resolveStylist, type Stylist } from "./tenancy"

/** URL-safe base64 for the link tokens — the client never sees a `+` or `/` in a pasted link. */
function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url")
}

/**
 * Public link tokens (client board and showroom intake) — separate secret, separate scope,
 * so rotating LINK_SECRET revokes every shared link without logging the stylist out.
 */
export function signLink(payload: { scope: "client" | "intake"; id: string; exp: number }): string {
  const secret = env().LINK_SECRET
  if (!secret) throw new Error("LINK_SECRET is not set (SETUP.md step 6)")
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyLink(token: string): { scope: "client" | "intake"; id: string } | null {
  const secret = env().LINK_SECRET
  if (!secret) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = createHmac("sha256", secret).update(body).digest("base64url")
  if (Buffer.from(sig).length !== Buffer.from(expected).length) return null
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      scope: "client" | "intake"
      id: string
      exp: number
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return { scope: payload.scope, id: payload.id }
  } catch {
    return null
  }
}

/**
 * Public links are handed out as tokens but stored as hashes, so a database dump does not grant
 * access to a client board. Same for the intake link (scope "intake", shorter life).
 */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function mintClientLink(jobId: string, days = 30): { token: string; hash: string } {
  const token = signLink({ scope: "client", id: jobId, exp: Math.floor(Date.now() / 1000) + days * 86_400 })
  return { token, hash: sha256(token) }
}

export function mintIntakeLink(requestId: string, days = 14): { token: string; hash: string } {
  const token = signLink({ scope: "intake", id: requestId, exp: Math.floor(Date.now() / 1000) + days * 86_400 })
  return { token, hash: sha256(token) }
}

/**
 * The signed-in stylist and the workspace they are working in.
 *
 * One Clerk read for the user (email, name) and one for the organization when the session has an
 * active one; `resolveStylist` then makes sure our `users` and `workspaces` rows exist. With no active
 * organization the stylist lands in a personal workspace, which is the solo-stylist case.
 */
export async function getStylist(): Promise<Stylist | null> {
  const { userId, orgId } = await clerkAuth()
  if (!userId) return null

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress
  if (!email) return null

  const org = orgId ? await clerk.organizations.getOrganization({ organizationId: orgId }) : null

  return resolveStylist({
    clerkUserId: userId,
    email,
    name: user.fullName,
    org: org ? { id: org.id, name: org.name, slug: org.slug } : null,
  })
}

/** For pages and server actions: sends a signed-out caller to Clerk's sign-in, keeping the return path. */
export async function requireStylist(): Promise<Stylist> {
  const stylist = await getStylist()
  if (!stylist) redirect("/sign-in")
  return stylist
}
