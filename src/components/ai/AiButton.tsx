"use client"

/**
 * AI button — the large card CTA that starts an agent run.
 *
 * This is the primitive the house uses wherever a person is handing work to the agent: the whole card
 * is the button, and while the run is live a light races around its border.
 *
 * Anatomy
 *   · the card is the EVA plate (white on the wall, 16px corner, the kit's shadow) — the button IS the
 *     card, not a control that happens to be large;
 *   · a title, one line of what the agent will do, and a trailing state (idle arrow / live status);
 *   · `data-running` turns on `::before`, an oversized conic disc that spins under the body, so the
 *     1.5px gap between disc and body stays lit. That is the racing border.
 *
 * The race is a border treatment, never a fill: the card's own surface stays white so the copy is
 * always readable, and the motion is suppressed entirely under `prefers-reduced-motion` (the border
 * then holds a static lit edge instead of disappearing, so the running state is still visible).
 */
import { ArrowRight, Sparkles } from "lucide-react"

export interface AiButtonProps {
  title: string
  /** What the agent will do when this is pressed. */
  description: string
  /** The live line, shown while running — e.g. "Drafting 3 requests…". */
  runningLabel?: string
  /** A short mono line under the title, for counts or model names. */
  meta?: string
  running?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function AiButton({
  title,
  description,
  runningLabel = "The agent is working…",
  meta,
  running = false,
  disabled = false,
  onClick,
}: AiButtonProps) {
  return (
    <button
      type="button"
      className="ai-button"
      data-running={running ? "true" : "false"}
      disabled={disabled || running}
      aria-busy={running}
      onClick={onClick}
    >
      <span className="ai-button-body">
        <span className="flex items-start justify-between gap-4">
          <span className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-brand" aria-hidden />
              <span className="text-[16px] font-semibold leading-tight text-foreground">{title}</span>
            </span>
            <span className="max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
              {running ? runningLabel : description}
            </span>
          </span>

          <span
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
            aria-hidden
          >
            {running ? (
              // Three dots: a run in progress, at the same weight as the arrow it replaces.
              <span className="flex gap-1">
                <span className="ai-dot size-1 rounded-full bg-foreground" />
                <span className="ai-dot size-1 rounded-full bg-foreground [animation-delay:160ms]" />
                <span className="ai-dot size-1 rounded-full bg-foreground [animation-delay:320ms]" />
              </span>
            ) : (
              <ArrowRight className="size-3.5" />
            )}
          </span>
        </span>

        {meta ? (
          <span className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">{meta}</span>
        ) : null}
      </span>
    </button>
  )
}
