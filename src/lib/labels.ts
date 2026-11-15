/**
 * What a label costs the studio: the carrier's own price, plus Pull's handling.
 *
 * The two numbers are recorded separately because only one of them is pass-through. A single
 * "total" would make a month's shipping impossible to reconcile: you could not tell Shippo's
 * charge from your revenue. The surcharge is a percentage rather than a flat fee so an express
 * label and a ground label carry the same proportion.
 *
 * Money is integer cents everywhere, for the same reason generations are integers: a half-cent
 * cannot be billed, and floating point accumulates an error that shows up in a statement.
 */
export const LABEL_SURCHARGE_RATE = 0.15

export type LabelCharge = {
  /** What the carrier charges, in cents. */
  carrierCents: number
  /** Pull's handling, in cents — rounded up, never down, so a rounding never eats a margin. */
  surchargeCents: number
  /** What the studio owes, in cents. */
  totalCents: number
  /** The rate applied, kept on the row so an old charge still explains itself after a change. */
  rate: number
  currency: string
}

export function labelCharge(carrierCents: number, currency = "USD"): LabelCharge {
  const safe = Number.isFinite(carrierCents) ? Math.max(0, Math.round(carrierCents)) : 0
  const surchargeCents = Math.ceil(safe * LABEL_SURCHARGE_RATE)
  return { carrierCents: safe, surchargeCents, totalCents: safe + surchargeCents, rate: LABEL_SURCHARGE_RATE, currency }
}
