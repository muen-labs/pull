/**
 * Tenancy — the one place that turns "someone signed in" into "which studio's data are they reading".
 *
 * Clerk owns identity and membership; this module owns the translation into our uuids, because every
 * query in the app joins on `workspaces.id`, not on a Clerk string. Three rules hold the design:
 *
 * 1. **Lazy, never webhook-dependent.** Every entry point calls `ensureUser` / `ensureWorkspace`,
 *    which are idempotent. A missed webhook must not mean a missing user; it means one extra query.
 * 2. **Race-safe without transactions.** Neon's HTTP driver has no interactive transactions, so the
 *    writes lean on unique constraints plus `onConflictDoNothing`, then read back. Two parallel
 *    first-loads therefore converge on one row instead of failing.
 * 3. **Clerk is the source of truth for membership.** The `memberships` table is a mirror kept so
 *    SQL can count seats and answer "their workspace" without a round trip — not a second opinion.
 */
import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { memberships, users, workspaces } from "@/db/schema"

/** What a signed-in stylist needs from the database, resolved once per request. */
export interface Stylist {
  /** Our `users.id` — the uuid the rest of the schema references. */
  id: string
  email: string
  /** The tenant every job, request and contact hangs off. */
  workspaceId: string
  /** `owner` | `stylist`, mirrored from the Clerk organization role. */
  role: string
}

export interface Identity {
  /** Clerk's `user_…`. */
  clerkUserId: string
  email: string
  name?: string | null
  /** The active Clerk organization, when the session has one. */
  org?: { id: string; name: string; slug?: string | null } | null
}

/**
 * The stylist row for this identity, created on first sight.
 *
 * A row may already exist for the email — the demo's magic-link era wrote one — so the lookup falls
 * back to the email and claims it for the Clerk user rather than creating a duplicate that would
 * orphan that user's jobs.
 */
export async function ensureUser(identity: Identity): Promise<{ id: string; email: string }> {
  const existing = await db()
    .select({ id: users.id, email: users.email, clerkUserId: users.clerkUserId })
    .from(users)
    .where(eq(users.clerkUserId, identity.clerkUserId))
    .limit(1)
  if (existing[0]) return { id: existing[0].id, email: existing[0].email }

  const email = identity.email.trim().toLowerCase()
  const byEmail = await db()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (byEmail[0]) {
    // Claim the pre-Clerk row. A concurrent claim writes the same value, so the update is harmless.
    await db().update(users).set({ clerkUserId: identity.clerkUserId }).where(eq(users.id, byEmail[0].id))
    return { id: byEmail[0].id, email: byEmail[0].email }
  }

  const inserted = await db()
    .insert(users)
    .values({ email, name: identity.name ?? null, clerkUserId: identity.clerkUserId })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, email: users.email })

  if (inserted[0]) return { id: inserted[0].id, email: inserted[0].email }

  // Lost the race to a parallel request: the row exists now.
  const raced = await db()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (!raced[0]) throw new Error(`pull: could not resolve a user row for ${email}`)
  return { id: raced[0].id, email: raced[0].email }
}

/**
 * The workspace this identity is working in, plus their role there.
 *
 * With an active organization the workspace mirrors it (one per studio). Without one — a signed-in
 * user who has not joined a studio, or a session that has not picked an org yet — they land in a
 * personal workspace named after them, which is also where a brand-new sign-up creates their first
 * job. That is the "lands in a personal workspace" half of Phase 1's done-when.
 */
export async function ensureWorkspace(
  identity: Identity,
  user: { id: string; email: string },
): Promise<{ workspaceId: string; role: string }> {
  const workspaceId = identity.org
    ? await workspaceForOrg(identity.org)
    : await workspaceForUser(user)

  const membership = await db()
    .select({ id: memberships.id, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, user.id)))
    .limit(1)
  if (membership[0]) return { workspaceId, role: membership[0].role }

  // No membership yet: they are the founder of this workspace, or a new stylist joining one.
  const others = await db()
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.workspaceId, workspaceId))
    .limit(1)
  const role = others[0] ? "stylist" : "owner"

  await db()
    .insert(memberships)
    .values({ workspaceId, userId: user.id, role })
    .onConflictDoNothing({ target: [memberships.workspaceId, memberships.userId] })

  // Seat count is derived, never incremented by hand: a lost or repeated insert cannot drift it.
  await syncSeatCount(workspaceId)
  return { workspaceId, role }
}

/** The workspace mirroring a Clerk organization, created the first time the org is seen. */
async function workspaceForOrg(org: { id: string; name: string }): Promise<string> {
  const found = await db()
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.clerkOrgId, org.id))
    .limit(1)
  if (found[0]) return found[0].id

  await db()
    .insert(workspaces)
    .values({ name: org.name, clerkOrgId: org.id })
    .onConflictDoNothing({ target: workspaces.clerkOrgId })

  const created = await db()
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.clerkOrgId, org.id))
    .limit(1)
  if (!created[0]) throw new Error(`pull: could not resolve a workspace for organization ${org.id}`)
  return created[0].id
}

/** A personal workspace for a signed-in user who is not (yet) in a studio. */
async function workspaceForUser(user: { id: string; email: string }): Promise<string> {
  const found = await db()
    .select({ workspaceId: memberships.workspaceId })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1)
  if (found[0]) return found[0].workspaceId

  const name = user.email.split("@")[0] || "Studio"
  const created = await db().insert(workspaces).values({ name }).returning({ id: workspaces.id })
  if (!created[0]) throw new Error("pull: could not create a personal workspace")
  return created[0].id
}

/** Denormalised seat count: the number of memberships, which is what Stripe's quantity mirrors. */
export async function syncSeatCount(workspaceId: string): Promise<number> {
  const rows = await db()
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.workspaceId, workspaceId))
  const count = Math.max(1, rows.length)
  await db().update(workspaces).set({ seatCount: count }).where(eq(workspaces.id, workspaceId))
  return count
}

/** Identity → the stylist record every server action scopes its queries by. */
export async function resolveStylist(identity: Identity): Promise<Stylist> {
  const user = await ensureUser(identity)
  const { workspaceId, role } = await ensureWorkspace(identity, user)
  return { id: user.id, email: user.email, workspaceId, role }
}
