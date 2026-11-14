"use client"

/**
 * Screen carousel — the three moves, one screen at a time, as a card.
 *
 * The capture is the explanation, so it moves: each step owns a short GIF recorded from the running
 * route (approved looks, the agent drafting, the board scrolling). Selecting a step swaps the frame in
 * place; nothing navigates and the card never reflows, because all three are mounted and only the
 * active one is painted — a GIF that has to load on click would flash the plate empty.
 *
 * The card is the EVA plate, inset-padded so the media reads as pressed into it.
 */
import { useState } from "react"

export interface ScreenStep {
  n: string
  title: string
  body: string
  label: string
  /** An animated GIF, recorded from the route it names. */
  gif: string
  alt: string
}

export function ScreenCarousel({ steps }: { steps: ScreenStep[] }) {
  const [active, setActive] = useState(0)
  const step = steps[active]

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12">
      {/* The steps: a list of buttons, the active one carrying its body copy. */}
      <div className="flex flex-col gap-1" role="tablist" aria-label="The three moves">
        {steps.map((item, index) => {
          const isActive = index === active
          return (
            <button
              key={item.n}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`screen-${item.n}`}
              id={`step-${item.n}`}
              onClick={() => setActive(index)}
              className={`border-l-2 py-3 pl-4 pr-2 text-left transition-colors ${
                isActive ? "border-brand" : "border-transparent hover:border-border"
              }`}
            >
              <span className="flex items-baseline gap-3">
                <span
                  className={`font-mono text-[11px] tracking-[0.02em] ${
                    isActive ? "text-brand" : "text-muted-foreground"
                  }`}
                >
                  {item.n}
                </span>
                <span
                  className={`text-[15px] font-medium leading-snug ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.title}
                </span>
              </span>
              {isActive ? (
                <span className="mt-2 block text-[13px] leading-relaxed text-muted-foreground">
                  {item.body}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* The card: one plate, the selected capture inside it. */}
      <div className="plate p-[14px]">
        <div className="relative aspect-[640/380] overflow-hidden rounded-[16px] bg-muted">
          {steps.map((item, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.n}
              src={item.gif}
              alt={item.alt}
              role="tabpanel"
              id={`screen-${item.n}`}
              aria-labelledby={`step-${item.n}`}
              hidden={index !== active}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ))}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 pb-0.5 pt-3">
          <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">{step.label}</p>
          <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
            {String(active + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  )
}
