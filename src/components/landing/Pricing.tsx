"use client"

/**
 * Plans — seats, priced per stylist, as the three cards the house uses.
 *
 * The card is the Muen plate (see the `plate` utility in globals.css): a white surface on the wall,
 * 16px corner, the kit's shadow, and a pill action at the top. The number under the name is the
 * reference's scale cue, and it is the only large type on the card — the price stays small so the
 * plans read as objects, not as a price table.
 *
 * Prices here are provisional: the shape is settled (Clerk accounts + a Stripe seat subscription), the
 * numbers are a proposal for the founder to confirm before this page ships. Annual is two months free.
 */
import { useState } from "react"
import { Check } from "lucide-react"

import { StartJobFlow } from "@/components/start-job/StartJobFlow"

interface Plan {
  id: string
  name: string
  blurb: string
  monthly: number | null
  annual: number | null
  /** What one seat buys, said plainly. */
  seats: string
  features: string[]
  cta: "start" | "talk"
}

const PLANS: Plan[] = [
  {
    id: "solo",
    name: "Solo",
    blurb: "One stylist, every job.",
    monthly: 29,
    annual: 24,
    seats: "1 seat",
    features: [
      "One seat — the stylist who signs in",
      "Unlimited jobs and looks",
      "Client links: approve, pass, circle",
      "Agent-drafted request emails",
    ],
    cta: "start",
  },
  {
    id: "studio",
    name: "Studio",
    blurb: "The studio, with the shipping.",
    monthly: 59,
    annual: 49,
    seats: "per seat",
    features: [
      "Everything in Solo",
      "Showroom links, parcel sizes and labels",
      "The contacts book, with agent matching",
      "Priority agent runs",
    ],
    cta: "start",
  },
  {
    id: "house",
    name: "House",
    blurb: "For teams that hand it around.",
    monthly: null,
    annual: null,
    seats: "custom",
    features: [
      "Everything in Studio",
      "Single sign-on",
      "Onboarding and team training",
      "A named person to call",
    ],
    cta: "talk",
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-full border border-border bg-[var(--plate)] p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
              annual ? "text-muted-foreground" : "bg-foreground text-[var(--plate)]"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
              annual ? "bg-foreground text-[var(--plate)]" : "text-muted-foreground"
            }`}
          >
            Annual · two months free
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Priced per seat. Clients and showrooms never take one.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan, index) => {
          const price = annual ? plan.annual : plan.monthly
          return (
            <article key={plan.id} className="plate flex flex-col gap-5 p-[18px]">
              {/* The action leads the card, as it does on the reference. */}
              {plan.cta === "start" ? (
                <StartJobFlow kind="nav" />
              ) : (
                <a
                  href="mailto:studio@muencollective.com?subject=Pull%20for%20the%20house"
                  className="btn btn-ghost btn-sm self-start"
                >
                  Talk to us →
                </a>
              )}

              <div>
                <h3 className="text-[16px] font-semibold leading-tight text-foreground">{plan.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{plan.blurb}</p>
              </div>

              {/* The number is the scale cue, not decoration: 01, 02, 03 down the row. */}
              <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>

              <div className="rounded-[16px] bg-muted p-4">
                <p className="flex items-baseline gap-1.5 text-foreground">
                  <span className="text-[22px] font-semibold leading-none tracking-[-0.02em]">
                    {price === null ? "Talk to us" : `$${price}`}
                  </span>
                  {price !== null ? (
                    <span className="text-[12px] text-muted-foreground">
                      / seat / {annual ? "mo, billed yearly" : "mo"}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-[11px] tracking-[0.02em] text-muted-foreground">{plan.seats}</p>

                <ul className="mt-4 flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] leading-snug text-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
