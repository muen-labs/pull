/**
 * The email gate on a client link.
 *
 * A signed link proves the link is ours; it cannot prove who is holding it. Forwarding it to a
 * second person is the one attack no signature prevents, so when a job has `clientVerify` on, the
 * board asks for the code that was sent to the address the studio emailed. A verified device gets a
 * signed cookie for that job only, so the client types a code once per device, not once per open.
 *
 * Everything here is server-only: the cookie is HMAC'd with LINK_SECRET, and the codes are stored
 * as hashes so a database read cannot replay one.
 */
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { env } from "./env"

/** One cookie per job — verifying job A must never open job B. */
export function gateCookieName(jobId: string): string {
  return `pull_cv_${jobId}`
}

/** How long a verified device stays verified. Long enough for a campaign, short enough to expire. */
const GATE_TTL_SECONDS = 60 * 60 * 24 * 30

/** How long a code lives. Short: the client is reading it out of their inbox right now. */
export const CODE_TTL_SECONDS = 10 * 60

/** Guess budget per code. Six digits plus five tries is 1 in 200,000 from a single code. */
export const MAX_ATTEMPTS = 5

function secret(): string {
  const s = env().LINK_SECRET
  if (!s) throw new Error("LINK_SECRET is not set (SETUP.md step 6)")
  return s
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url")
}

/** A fresh six-digit code. `randomInt` is uniform, unlike `Math.random`-shaped shortcuts. */
export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

/** Codes are stored per job: the same six digits are a different hash on a different board. */
export function hashCode(jobId: string, code: string): string {
  return createHash("sha256").update(`${jobId}:${code}:${secret()}`).digest("hex")
}

/** True when the typed code matches, in constant time. */
export function codeMatches(jobId: string, typed: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(jobId, typed.trim()), "utf8")
  const b = Buffer.from(storedHash.trim().toLowerCase(), "utf8")
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Value written to the device cookie: `<expiry>.<signature>` for this job. */
export function gateCookieValue(jobId: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + GATE_TTL_SECONDS
  return `${exp}.${sign(`gate:${jobId}:${exp}`)}`
}

/** Reads the cookie and checks both the signature and the expiry. */
export async function gateOpenFor(jobId: string): Promise<boolean> {
  const raw = (await cookies()).get(gateCookieName(jobId))?.value
  if (!raw) return false
  const [expRaw, sig] = raw.split(".")
  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now() || !sig) return false
  const expected = Buffer.from(sign(`gate:${jobId}:${exp}`), "utf8")
  const actual = Buffer.from(sig, "utf8")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/** What the gate screen is allowed to show of the client's address. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "your email"
  const [local, domain] = email.split("@")
  if (!domain) return email
  const head = local.slice(0, 1)
  return `${head}${"•".repeat(Math.max(2, local.length - 1))}@${domain}`
}
