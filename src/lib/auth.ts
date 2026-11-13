/**
 * Auth — two jobs, and only one of them is still ours.
 *
 * **Identity** belongs to Clerk: `getStylist()` reads the session, resolves the user and their
 * workspace through `lib/tenancy`, and every caller keeps working unchanged.
 *
 * **Links** stay ours: the client board (`/b/[token]`) and showroom intake (`/i/[token]`) are signed
 * with LINK_SECRET and verified here. They must never be Clerk-gated — a client never has an account.
 *
 * The magic-link session below is the demo-era mechanism, kept only so `sendMagicLink` still compiles
 * until `/login` is deleted; nothing reads the cookie any more.
 */
import { createHash, createHmac, timingSafeEqual, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth as clerkAuth, clerkClient } from "@clerk/nextjs/server"
import { env, isAllowedEmail } from "./env"
import { resolveStylist, type Stylist } from "./tenancy"

const COOKIE = "pull_session"
const MAGIC_TTL = 60 * 15 // 15 minutes
const SESSION_TTL = 60 * 60 * 24 * 30 // 30 days

interface TokenPayload {
  email: string
  purpose: "login" | "session"
  exp: number
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url")
}

export function signToken(payload: TokenPayload): string {
  const secret = env().AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set (SETUP.md step 6)")
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyToken(token: string | undefined): TokenPayload | null {
  const secret = env().AUTH_SECRET
  if (!token || !secret) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = createHmac("sha256", secret).update(body).digest("base64url")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function createMagicToken(email: string): string {
  return signToken({ email, purpose: "login", exp: Math.floor(Date.now() / 1000) + MAGIC_TTL })
}

export function consumeMagicToken(token: string): string | null {
  const payload = verifyToken(token)
  if (!payload || payload.purpose !== "login") return null
  if (!isAllowedEmail(payload.email)) return null
  return payload.email
}

export async function startSession(email: string): Promise<void> {
  const token = signToken({ email, purpose: "session", exp: Math.floor(Date.now() / 1000) + SESSION_TTL })
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL,
  })
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function getSession(): Promise<{ email: string } | null> {
  const jar = await cookies()
  const payload = verifyToken(jar.get(COOKIE)?.value)
  if (!payload || payload.purpose !== "session") return null
  return { email: payload.email }
}

export function newSecret(): string {
  return randomBytes(32).toString("hex")
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
