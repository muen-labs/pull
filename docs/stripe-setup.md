# Stripe — the Muen catalogue (LIVE)

Built 2026-11-14 in **Muen Collective LLC** — `acct_1UZXrnLYadefLIhi`, charges and payouts enabled.
Created with a restricted live key (`rk_live_…`, "Subscriptions" template) that was copied straight into
Pull's env and never printed.

## Organization, account, products

```
Organization: Muen Collective            ← container; cannot sell anything
  └── account: Muen Collective LLC       ← the seller on every invoice
        ├── Brand OS        prod_VdAvlyDr7lxECQ   (no prices yet)
        ├── NERV            prod_VdAvx7tMyX5rni   (no prices yet)
        ├── Voice Koara     prod_VdAvn5vgyF9XPq   (no prices yet)
        ├── Pull            prod_VdAvSuZq8T3OGk
        └── Pull — credit   prod_VdAvsWQFMDZ1Xf
```

Every product carries `metadata.muen_product` (`brand-os`, `nerv`, `voice-koara`, `pull`, `pull-credit`)
so a webhook can route a subscription to the right app without a mapping table. Products for Brand OS,
NERV and Voice Koara deliberately have **no prices** — pricing is undecided, and an invented price is a
lie someone later bills from.

## Pull prices

| choice | amount | interval | id |
|---|---|---|---|
| Solo monthly | $29.00 | month | `price_1UbuZnLYadefLIhioffowmbl` |
| Studio monthly | $59.00 | month | `price_1UbuZnLYadefLIhir9pBeFZB` |
| Solo annual | $290.00 | year | `price_1UbuZnLYadefLIhihmdzx9ga` |
| Studio annual | $590.00 | year | `price_1UbuZoLYadefLIhiPe4rsqdp` |
| Credit $50 | $50.00 | one-time | `price_1UbuZoLYadefLIhif5xMhvjF` |
| Credit $100 | $100.00 | one-time | `price_1UbuZoLYadefLIhisMHgiGS0` |
| Credit $200 | $200.00 | one-time | `price_1UbuZoLYadefLIhimNNcXljy` |

Annual is a price, not a discount: $290 is ten months of $29 — the "two months free" the landing
promises. Studio is a **three-seat bundle, one seat free**, so it is one subscription with seats in
metadata, never `quantity × $59`.

## Webhook

`we_1Ubua2LYadefLIhizP7i0ViB` → `https://pull-app-delta.vercel.app/api/webhooks/stripe`

Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`,
`invoice.payment_failed`.

Signing secret lives in `STRIPE_WEBHOOK_SECRET` (Vercel production + `.env.local`). The route
`/api/webhooks/stripe` is **not built yet**, so deliveries 404 until it is — Stripe retries.

## Environment

| variable | what |
|---|---|
| `STRIPE_SECRET_KEY_MUEN` | the live restricted key (catalogue, checkout, subscriptions) |
| `STRIPE_WEBHOOK_SECRET` | this endpoint's signing secret |
| `STRIPE_PRICE_SOLO_MONTHLY` … | not set yet — wire when the checkout code lands |

## Open

- **Test-mode parity.** A sandbox catalogue still exists under `acct_1TmmVJPrALc4hAUl` ("New business")
  with different price IDs. Either recreate the same seven prices there for testing, or accept that
  checkout can only be exercised against live objects — the second is not acceptable, so recreate them.
- **Webhook route** — the four pieces: checkout for the two plans, subscription sync onto the workspace,
  credit top-up, and the failed-payment state.
- **Wallet reset clock** — move the 100/300 grant to `invoice.paid` so billing and allowance share one cycle.
