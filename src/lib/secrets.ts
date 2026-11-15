/**
 * Workspace secrets — provider credentials a studio brings itself.
 *
 * Encrypted at rest with AES-256-GCM under `SETTINGS_SECRET` (or `LINK_SECRET` as a fallback so an
 * existing deployment does not have to add a variable before the page is usable). The value is only
 * ever decrypted on the server; the settings page reads a provider's `last4` and nothing else.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { workspaceSecrets } from "@/db/schema"

export type ProviderId = "shippo" | "resend" | "cloudinary" | "zoowork"

function key(): Buffer {
  const raw = process.env.SETTINGS_SECRET ?? process.env.LINK_SECRET
  if (!raw) throw new Error("SETTINGS_SECRET (or LINK_SECRET) must be set to store workspace secrets")
  return createHash("sha256").update(raw).digest()
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), body.toString("base64")].join(".")
}

export function decryptSecret(stored: string): string {
  const [iv, tag, body] = stored.split(".")
  if (!iv || !tag || !body) throw new Error("stored secret is malformed")
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8")
}

export function last4Of(secret: string): string {
  return secret.slice(-4)
}

/** Store (or replace) a studio's key for a provider. */
export async function saveSecret(workspaceId: string, provider: ProviderId, value: string): Promise<void> {
  const database = db()
  await database
    .insert(workspaceSecrets)
    .values({ workspaceId, provider, ciphertext: encryptSecret(value), last4: last4Of(value), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [workspaceSecrets.workspaceId, workspaceSecrets.provider],
      set: { ciphertext: encryptSecret(value), last4: last4Of(value), updatedAt: new Date() },
    })
}

/** The studio's own key, or null when they have not connected the provider. */
export async function readSecret(workspaceId: string, provider: ProviderId): Promise<string | null> {
  const database = db()
  const [row] = await database
    .select({ ciphertext: workspaceSecrets.ciphertext })
    .from(workspaceSecrets)
    .where(and(eq(workspaceSecrets.workspaceId, workspaceId), eq(workspaceSecrets.provider, provider)))
    .limit(1)
  if (!row) return null
  try {
    return decryptSecret(row.ciphertext)
  } catch {
    // A rotated SETTINGS_SECRET must not take the whole page down: treat it as "not connected" and
    // let the studio re-enter the key.
    return null
  }
}

/** What the settings page is allowed to know: which key, not what it is. */
export async function readSecretState(
  workspaceId: string,
  provider: ProviderId,
): Promise<{ connected: boolean; last4: string | null; updatedAt: string | null }> {
  const database = db()
  const [row] = await database
    .select({ last4: workspaceSecrets.last4, updatedAt: workspaceSecrets.updatedAt })
    .from(workspaceSecrets)
    .where(and(eq(workspaceSecrets.workspaceId, workspaceId), eq(workspaceSecrets.provider, provider)))
    .limit(1)
  return row ? { connected: true, last4: row.last4, updatedAt: row.updatedAt.toISOString() } : { connected: false, last4: null, updatedAt: null }
}

export async function removeSecret(workspaceId: string, provider: ProviderId): Promise<void> {
  const database = db()
  await database
    .delete(workspaceSecrets)
    .where(and(eq(workspaceSecrets.workspaceId, workspaceId), eq(workspaceSecrets.provider, provider)))
}
