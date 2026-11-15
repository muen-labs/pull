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
import { useCallback, useEffect, useRef, useState } from "react"

import { Fold } from "./Fold"
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
  /** What the price buys, for the line after it: "1 seat", "4 seats". */
  per: string
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
    per: "1 seat",
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
    blurb: "Four seats, with the shipping.",
    monthly: 59,
    annual: 49,
    seats: "4 seats",
    per: "4 seats",
    features: [
      "Four seats — the founder and three assistants",
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
    per: "custom",
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

  /**
   * The thumb is sized and placed from the active button, not from a 50/50 split: "Monthly" and
   * "Annual · two months free" are different widths, and a fixed half would either overhang or fall
   * short. Measuring also keeps it honest when the control wraps on a narrow screen.
   */
  const trackRef = useRef<HTMLDivElement | null>(null)
  const monthRef = useRef<HTMLButtonElement | null>(null)
  const annualRef = useRef<HTMLButtonElement | null>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)

  const measure = useCallback(() => {
    const track = trackRef.current
    const active = annual ? annualRef.current : monthRef.current
    if (!track || !active) return
    const t = track.getBoundingClientRect()
    const a = active.getBoundingClientRect()
    setThumb({ left: a.left - t.left, width: a.width })
  }, [annual])

  useEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (trackRef.current) observer.observe(trackRef.current)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return (
    <div>
      <Fold delay={0.18}>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div
          ref={trackRef}
          role="group"
          aria-label="Billing period"
          className="relative flex items-center gap-1 rounded-full p-1"
          style={{ background: "var(--segmented-track)" }}
        >
          {/* The travelling pill: it carries the ink, so the active option is a shape and not a swap. */}
          {thumb ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-1 rounded-full bg-[var(--segmented-thumb)] transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
              style={{
                left: thumb.left,
                width: thumb.width,
                boxShadow: "0 1px 2px rgb(0 0 0 / 0.08), inset 0 1px 0 #ffffff",
              }}
            />
          ) : null}

          <button
            ref={monthRef}
            type="button"
            onClick={() => setAnnual(false)}
            aria-pressed={!annual}
            className={`relative z-10 rounded-full px-4 py-1.5 text-[13px] transition-colors duration-200 ${
              annual ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            ref={annualRef}
            type="button"
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={`relative z-10 rounded-full px-4 py-1.5 text-[13px] transition-colors duration-200 ${
              annual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Annual · two months free
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Priced per seat. Clients and showrooms never take one.
        </p>
      </div>
      </Fold>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan, index) => {
          const price = annual ? plan.annual : plan.monthly
          return (
            <Fold key={plan.id} delay={0.27 + index * 0.09} className="h-full">
              <article className="plate flex h-full flex-col items-start gap-5 p-[18px]">
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

              {/* The price is the card's scale cue, where the row index used to sit: the plan is a
                  number before it is a list, and the number belongs at the size of a headline. */}
              <p className="flex items-baseline gap-1.5 text-foreground">
                <span
                  key={`${plan.id}-${annual ? "annual" : "monthly"}`}
                  className={`font-semibold leading-none tracking-[-0.03em] motion-safe:animate-[price-in_240ms_ease-out] ${
                    price === null ? "text-[26px]" : "text-[34px]"
                  }`}
                >
                  {price === null ? "Talk to us" : `$${price}`}
                </span>
                {price !== null ? (
                  <span className="text-[13px] text-muted-foreground">
                    / {plan.per} / {annual ? "mo, billed yearly" : "mo"}
                  </span>
                ) : null}
              </p>

              {/* The card's own content still fills it; only the action hugs its label. The panel
                  is anchored to the bottom, so all three cards finish their list at the same line
                  however much copy sits above it. */}
              <div className="mt-auto w-full rounded-[16px] bg-muted p-4">
                <p className="text-[11px] tracking-[0.02em] text-muted-foreground">{plan.seats}</p>

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
            </Fold>
          )
        })}
      </div>
    </div>
  )
}
