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
| **Studio address** *(built)* | **blocking for shipping.** Shippo cannot quote a rate without `street1, city, state, zip, country` — the intake page currently answers *"The studio address is incomplete — missing street1, city, zip, country. Rates cannot be quoted until the stylist adds it in the studio settings."* |
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

Each row: label, state (`connected` / `not set` / `failing`), last 4 characters, "Test connection",
and a write-only field. Secrets are never returned to the browser — the field is blank until replaced,
and saving is the only way to change it.

| integration | what breaks without it |
|---|---|
| **Shipping (Shippo)** | no rates, no labels. Needs the key **and** a complete studio address |
| Email (Resend) | request emails stay drafts |
| Images (Cloudinary) | boards fall back to local storage |
| Agent (ZooWork) + PRISM sink | renders fall back to sample output; runs are not mirrored |

### Storage

Secrets belong in a `workspace_secrets` table, one row per (workspace, provider), value encrypted at
rest with AES-256-GCM (`SETTINGS_SECRET` env as the key), never selected into a client component.
Platform env keys remain the fallback so the demo keeps working without a studio's own account.

### The agent and the developer account — what is actually possible

An agent **cannot** create a Shippo account. Signup needs an email verification link and, for live
labels, card details; neither can be done on someone's behalf. What it can do, honestly:

1. open the signup page and pre-fill the studio's details;
2. stop and ask the person to verify the email and reach the API-keys page;
3. take the **test** key, call `GET /v1/shippo-addresses` with it to prove the key works, then quote a
   real rate from this studio's address to a sample showroom;
4. write the key only after that round trip succeeds, so "connected" means connected.

Recorded as a job on the page ("Set up shipping"), not as a magic button.

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

1. **Studio address + shipping key together** — the address already exists, the key does not, and
   neither is useful alone. Highest value, no new decisions.
2. **Wallet statement + low-balance alert** — the wallet exists; the page just has to show it.
3. **Appearance** — after the kit's dark defect is fixed.
4. **Team and seats** — needs the Clerk organization invitation flow wired to seat counts.
5. **Top up** — blocked on Stripe.
