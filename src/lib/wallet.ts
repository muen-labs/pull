/**
 * The agent wallet — one balance per workspace, shared by its seats.
 *
 * What costs what (generations):
 *   render    1  a canvas render — the only step that pays the image provider per call
 *   research  1  a suggest-looks run (vision + web)
 *   draft     0  email drafting is templates, not a paid call
 *
 * At zero the wallet STOPS. The check happens before the provider is called, so an exhausted studio
 * never accumulates a bill it did not ask for; the route answers `wallet_empty` and the canvas shows
 * how to top up. Nothing is spent on a request that cannot be paid for.
 */
import { and, eq, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { wallets, walletEntries, workspaces } from "@/db/schema"

/** Generations granted per month, by plan. House is negotiated and starts at Studio's grant. */
export const PLAN_GRANTS = { solo: 100, studio: 300, house: 300 } as const

export type PlanId = keyof typeof PLAN_GRANTS

export const WALLET_COST = { render: 1, research: 1, draft: 0 } as const

export type WalletState = {
  workspaceId: string
  balance: number
  /** Prepaid money in cents — what a label is paid from, on the spot. */
  moneyCents: number
  grant: number
  periodStart: string
  plan: string
}

export type SpendResult =
  | { ok: true; balance: number }
  | { ok: false; reason: "wallet_empty" | "wallet_missing"; balance: number }

export function grantForPlan(plan: string): number {
  return PLAN_GRANTS[(plan in PLAN_GRANTS ? plan : "solo") as PlanId]
}

/**
 * Read the wallet, creating it on first use and rolling the period if a month has passed.
 *
 * The roll is a single conditional UPDATE rather than read-then-write: two tabs opening the studio at
 * the same moment would otherwise each grant a fresh allowance.
 */
export async function ensureWallet(workspaceId: string): Promise<WalletState> {
  const database = db()

  // The plan lives on the workspace, not on the wallet: a plan change moves the grant, and the
  // wallet never becomes the place billing truth is stored twice.
  const [workspace] = await database
    .select({ plan: workspaces.plan })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
  const plan = workspace?.plan ?? "solo"
  const grant = grantForPlan(plan)

  await database
    .insert(wallets)
    .values({ workspaceId, balance: grant, monthlyGrant: grant })
    .onConflictDoNothing()

  // Past the period: put the allowance back, from this moment.
  await database
    .update(wallets)
    .set({ balance: grant, monthlyGrant: grant, periodStart: sql`now()`, updatedAt: sql`now()` })
    .where(
      and(eq(wallets.workspaceId, workspaceId), sql`${wallets.periodStart} < now() - interval '30 days'`),
    )

  // Plan change (upgrade/downgrade) moves the grant without touching what is left.
  await database
    .update(wallets)
    .set({ monthlyGrant: grant, updatedAt: sql`now()` })
    .where(and(eq(wallets.workspaceId, workspaceId), sql`${wallets.monthlyGrant} <> ${grant}`))

  const [row] = await database.select().from(wallets).where(eq(wallets.workspaceId, workspaceId)).limit(1)
  if (!row) throw new Error("wallet could not be read")

  return {
    workspaceId,
    balance: row.balance,
    moneyCents: row.moneyCents,
    grant: row.monthlyGrant,
    periodStart: row.periodStart.toISOString(),
    plan,
  }
}

/**
 * Spend from the wallet, or refuse.
 *
 * The conditional UPDATE is the whole guarantee: `balance >= cost` is evaluated by Postgres, so two
 * concurrent renders cannot both pass a check that only one of them can pay for.
 */
export async function spendFromWallet(
  workspaceId: string,
  cost: number,
  reason: string,
  runId?: string,
): Promise<SpendResult> {
  const database = db()
  if (cost <= 0) {
    const [row] = await database.select().from(wallets).where(eq(wallets.workspaceId, workspaceId)).limit(1)
    return { ok: true, balance: row?.balance ?? 0 }
  }

  const updated = await database
    .update(wallets)
    .set({ balance: sql`${wallets.balance} - ${cost}`, updatedAt: sql`now()` })
    .where(and(eq(wallets.workspaceId, workspaceId), sql`${wallets.balance} >= ${cost}`))
    .returning({ balance: wallets.balance })

  const [existing] = await database
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(eq(wallets.workspaceId, workspaceId))
    .limit(1)

  if (updated.length === 0) {
    return existing ? { ok: false, reason: "wallet_empty", balance: existing.balance } : { ok: false, reason: "wallet_missing", balance: 0 }
  }

  const balance = updated[0].balance
  await database.insert(walletEntries).values({
    workspaceId,
    delta: -cost,
    balanceAfter: balance,
    reason,
    runId: runId ?? null,
  })
  return { ok: true, balance }
}

/** Give a spend back — a render that failed never became a look, so it never becomes a charge. */
export async function refundWallet(
  workspaceId: string,
  cost: number,
  reason = "refund",
  runId?: string,
): Promise<number> {
  const database = db()
  const updated = await database
    .update(wallets)
    .set({ balance: sql`${wallets.balance} + ${cost}`, updatedAt: sql`now()` })
    .where(eq(wallets.workspaceId, workspaceId))
    .returning({ balance: wallets.balance })

  const balance = updated[0]?.balance ?? 0
  await database.insert(walletEntries).values({
    workspaceId,
    delta: cost,
    balanceAfter: balance,
    reason,
    runId: runId ?? null,
  })
  return balance
}

/** The statement: the last N movements, newest first. */
export async function readLedger(workspaceId: string, limit = 20) {
  const database = db()
  return database
    .select()
    .from(walletEntries)
    .where(eq(walletEntries.workspaceId, workspaceId))
    .orderBy(sql`${walletEntries.createdAt} desc`)
    .limit(limit)
}

/**
 * Spend prepaid money, or refuse.
 *
 * Labels are charged on the spot, so this is the gate that runs BEFORE the carrier is paid: the
 * conditional UPDATE is what stops two labels being bought against one balance, and a studio with
 * nothing left is told how much it needs rather than being allowed to run up a debt.
 */
export async function spendMoney(
  workspaceId: string,
  cents: number,
  reason: string,
  detail?: { runId?: string; note?: string },
): Promise<{ ok: true; moneyCents: number } | { ok: false; reason: "wallet_empty" | "wallet_missing"; moneyCents: number }> {
  const database = db()
  const amount = Math.max(0, Math.round(cents))

  const updated = await database
    .update(wallets)
    .set({ moneyCents: sql`${wallets.moneyCents} - ${amount}`, updatedAt: sql`now()` })
    .where(and(eq(wallets.workspaceId, workspaceId), sql`${wallets.moneyCents} >= ${amount}`))
    .returning({ moneyCents: wallets.moneyCents })

  const [existing] = await database
    .select({ moneyCents: wallets.moneyCents })
    .from(wallets)
    .where(eq(wallets.workspaceId, workspaceId))
    .limit(1)

  if (updated.length === 0) {
    return existing
      ? { ok: false, reason: "wallet_empty", moneyCents: existing.moneyCents }
      : { ok: false, reason: "wallet_missing", moneyCents: 0 }
  }

  const moneyCents = updated[0].moneyCents
  await database.insert(walletEntries).values({
    workspaceId,
    delta: -amount,
    balanceAfter: moneyCents,
    reason,
    unit: "cent",
    runId: detail?.runId ?? null,
    note: detail?.note ?? null,
  })
  return { ok: true, moneyCents }
}

/** Give money back — a purchase that failed never became a label, so it never becomes a charge. */
export async function refundMoney(workspaceId: string, cents: number, reason = "refund", note?: string): Promise<number> {
  const database = db()
  const amount = Math.max(0, Math.round(cents))
  const updated = await database
    .update(wallets)
    .set({ moneyCents: sql`${wallets.moneyCents} + ${amount}`, updatedAt: sql`now()` })
    .where(eq(wallets.workspaceId, workspaceId))
    .returning({ moneyCents: wallets.moneyCents })
  const moneyCents = updated[0]?.moneyCents ?? 0
  await database.insert(walletEntries).values({
    workspaceId,
    delta: amount,
    balanceAfter: moneyCents,
    reason,
    unit: "cent",
    note: note ?? null,
  })
  return moneyCents
}

/** Top up prepaid money (manual until Stripe lands). */
export async function topUpMoney(workspaceId: string, cents: number, note?: string): Promise<number> {
  const database = db()
  const amount = Math.max(0, Math.round(cents))
  const updated = await database
    .update(wallets)
    .set({ moneyCents: sql`${wallets.moneyCents} + ${amount}`, updatedAt: sql`now()` })
    .where(eq(wallets.workspaceId, workspaceId))
    .returning({ moneyCents: wallets.moneyCents })
  const moneyCents = updated[0]?.moneyCents ?? 0
  await database.insert(walletEntries).values({
    workspaceId,
    delta: amount,
    balanceAfter: moneyCents,
    reason: "top_up",
    unit: "cent",
    note: note ?? null,
  })
  return moneyCents
}
