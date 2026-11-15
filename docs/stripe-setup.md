# Stripe — the Muen catalogue

Created 2026-11-14 with the Stripe CLI, in the account the CLI was authorised against:
**New business sandbox · sandbox — `acct_1TmmVJPrALc4hAUl`**.

> ⚠️ The dashboard link given at the time pointed at a *different* account, `acct_1UZXrnLYadefLIhi`.
> These objects exist in the sandbox. Before Pull charges a real studio, decide which account is the
> Muen billing account and recreate the catalogue there — the price IDs change, which is why they
> belong in environment variables rather than in code.

## Products — one per product in the portfolio

| product | `muen_product` | id |
|---|---|---|
| Brand OS | `brand-os` | `prod_VdAQ3IHbPPUfph` |
| NERV | `nerv` | `prod_VdAQr9GgoZNxAi` |
| Pull | `pull` | `prod_VdAQpJUojUeQYR` |
| Voice Koara | `voice-koara` | `prod_VdAQkhexzmFfTl` |
| Pull — credit | `pull-credit` | `prod_VdAQ4c3Dk8MpGv` |

The metadata key is `muen_product`, so a webhook can route a subscription to the right app without a
mapping table. Brand OS, NERV and Voice Koara have **no prices yet** — their pricing is undecided, and an
invented price is worse than an absent one.

## Prices — Pull

| price | amount | interval | id |
|---|---|---|---|
| Solo | $29.00 | month | `price_1Ubu5DPrALc4hAUlJ2JllMMp` |
| Solo (annual) | $290.00 | year | `price_1Ubu5EPrALc4hAUlcBqrtDhR` |
| Studio | $59.00 | month | `price_1Ubu5EPrALc4hAUlBULpQ9vY` |
| Studio (annual) | $590.00 | year | `price_1Ubu5EPrALc4hAUl1yfOGUli` |
| Credit $50 | $50.00 | one-time | `price_1Ubu5FPrALc4hAUlYCNlmZGp` |
| Credit $100 | $100.00 | one-time | `price_1Ubu5GPrALc4hAUleHXmxAcM` |
| Credit $200 | $200.00 | one-time | `price_1Ubu5GPrALc4hAUlrEfUqgTS` |

Annual is a **price**, not a discount: $290 is ten months of $29, which is the "two months free" the
landing already promises. Studio is a **3-seat bundle** (one seat free), so it is one subscription with
`seats` in metadata, never `quantity × $59` — a four-person studio would otherwise pay $236 for three
seats.

## Webhook

`we_1Ubu5LPrALc4hAUlSjiTgAGA` → `https://pull-app-delta.vercel.app/api/webhooks/stripe`

Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`,
`invoice.paid`, `invoice.payment_failed`.

The signing secret is in `STRIPE_WEBHOOK_SECRET` (Vercel production + `.env.local`). The route
`/api/webhooks/stripe` does not exist yet, so deliveries 404 until it is built — Stripe retries, and
nothing is lost.

## Still needed

- **`STRIPE_SECRET_KEY`** — the CLI stores no plain key in its config, so this has to come from
  Developers → API keys (test mode). Until it is set, the app cannot create Checkout sessions.
- **Which account bills.** See the warning at the top.
