# Settings — scope

Written 2026-11-14. A studio's settings page is where the product's promises become the studio's
own configuration: their address, their shipping account, their wallet, their team. Today
`/studio/settings` holds one thing (the studio address). This is the scope for the whole page.

Three of the sections below are blocked on credentials, not code. Those are marked.

---

## 1. Studio

| field | why |
|---|---|
| Studio name | appears on client links and request emails |
| **Studio address** *(built)* | **blocking for shipping, and studio-owned.** Shippo cannot quote a rate without `street1, city, state, zip, country` — the intake page currently answers *"The studio address is incomplete — missing street1, city, zip, country. Rates cannot be quoted until the stylist adds it in the studio settings."* |
| Phone | required by carriers on labels |
| Timezone | dates on requests ("return by") are computed server-side |

## 2. Team and seats

Seats are the billing unit now (Solo 1, Studio 3 with one free), so the page must show them:

- members with roles (`owner` / `stylist`), from the Clerk organization;
- invite by email;
- **seat count is the subscription quantity** — an invitation that adds a fourth seat on Studio
  either converts to a House conversation or is refused, and the page has to say which.

## 3. Plan, wallet and top-up

- **Balance + grant** — `N of M generations left this month`, the same number the studio header shows;
- **The statement** — `wallet_entries` read back as a list (when, what, how many, which run);
- **Top up** — *blocked on the Muen Stripe key.* Until then: a "request more" action that records the
  intent and emails the studio, with the ledger already able to reconcile it by hand;
- **Low-balance alert** — warn at 20% and again at 0. The wallet hard-stops, so the warning is the
  difference between a studio topping up and a studio being interrupted mid-shoot.

What costs what, stated on the page rather than discovered: render 1, research 1, drafting 0.

## 4. Integrations

**These are Muen's accounts, not the studio's.** A studio never pastes a provider key: Muen holds the
Shippo, Resend, Cloudinary and ZooWork accounts, and every workspace draws on them. So integrations are
not a studio setting at all — they belong to an **internal ops view** that shows each provider's state
(`connected` / `not set` / `failing`), the environment it resolved from, and a "test connection" that
runs the same check a run would. A studio sees, at most, whether shipping is available.

This also decides who carries the cost: **Muen buys every label**. That has to be metered (see §3) or a
busy studio's labels quietly become Muen's expense.

| integration | what breaks without it |
|---|---|
| **Shipping (Shippo)** | no rates, no labels. Needs Muen's key **and** a complete studio address |
| Email (Resend) | request emails stay drafts |
| Images (Cloudinary) | boards fall back to local storage |
| Agent (ZooWork) + PRISM sink | renders fall back to sample output; runs are not mirrored |

### Storage

Platform env vars (`SHIPPO_API_KEY`, `RESEND_API_KEY`, `CLOUDINARY_*`, `ZOOWORK_API_KEY`). No
per-workspace credentials table: there is no studio-owned secret to store, and an encrypted table of
them would exist only to be unused.

### Who creates the developer account

**Muen's developer**, once — not each studio, and not an agent. An agent cannot complete a provider
signup (email verification, CAPTCHA, card details); it can pre-fill a form and verify the resulting key,
nothing more. So the honest flow is:

1. a Muen person creates the Shippo account and takes a **test** key;
2. the key goes into Vercel's environment, never into a settings field;
3. the ops view runs `GET /v1/carrier_accounts` with it and reports the state;
4. a real rate is quoted from a studio's address to a sample showroom — the only proof that shipping
   works end to end.

The agent's job is step 3 and 4 (verification), plus telling the person exactly which page to open for
step 1.

## 5. Client links

Defaults for every link the studio sends: expiry (14 days for showrooms, 30 for clients), whether the
client may draw markup, and the default return window. One place, because these are the terms of the
hand-off and they should not be decided per job by whoever sends first.

## 6. Appearance — auto, light, dark

`auto | light | dark`, following the OS by default, with the choice stored per user (not per
workspace: two stylists in one studio may disagree).

**This is not a toggle today.** Two things have to happen first:

1. **EVA's dark theme has a known contrast defect** — `--brand` on dark measures 3.20:1, below AA.
   It was reported upstream, not patched locally. Shipping a dark mode over it would ship unreadable
   red on every check icon and markup hint.
2. **PULL's own tokens are light-only.** `pull-extras.css` defines `--markup`, `--card-raised`,
   `--scrim-flat`, `--ok`, the `--dark*` family as light values. Dark needs a second set and an audit
   of every surface that composes them — including the emoji-free icon colours.

Order: fix the kit defect → dark token set → toggle.

## 7. Notifications

Bell and/or email for: client submitted approvals, a label came back, wallet low, agent run failed.
A studio that misses "label came back" loses a shipping day.

## 8. Data

- **Export a job** (the board, the markups, the requests, the ledger rows for it) as one archive;
- **Delete a job** — its images go with it (already the documented promise);
- **Delete the workspace** — destructive, typed confirmation, Clerk organization too.

---

## What I would not build

- Per-job overrides of the link defaults (defaults + one override at send time is enough);
- Notification granularity beyond the four events above;
- A second settings surface per product — Muen has four products and one Clerk app; this page should
  stay the single place a studio configures itself, with product sections appearing as they ship.

## Build order

1. **Studio address** *(built)* — the studio's own half of shipping. The other half is Muen's: a key in
   the environment plus an ops check, not a field on this page.
2. **Wallet statement + low-balance alert** — the wallet exists; the page just has to show it.
3. **Appearance** — after the kit's dark defect is fixed.
4. **Team and seats** — needs the Clerk organization invitation flow wired to seat counts.
5. **Top up** — blocked on Stripe.

---

## Correction (2026-11-14)

An earlier draft of this page gave each studio a field for its own Shippo key. That was wrong about the
architecture: **the integrations are Muen's backend.** The shipping-key field, the encrypted
`workspace_secrets` table and the per-workspace override in `lib/shippo.ts` were built and then removed
in the same day — the table is dropped from the database. What survives is the part that was always
true: the studio owns its **address**, Muen owns the accounts, and the wallet has to carry the label
cost because Muen pays it.
