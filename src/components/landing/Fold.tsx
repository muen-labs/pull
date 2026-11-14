import type { ReactNode } from "react"

/**
 * One block of a section, folded.
 *
 * A section is too coarse an object: the heading, the copy, the action and the media inside one are
 * separate things and should arrive separately. So each is its own `[data-fold]` block, with its own
 * clip, its own observer entry, and its own `transition-delay` from the `delay` prop — that is the
 * stagger. (A stagger applied through the observer instead would serialise the reveals behind one
 * another rather than offsetting them.)
 *
 * `fade` is the skill's fade variant, for blocks whose own motion would fight the travel: the
 * marquee, the carousel, and the canvas composition whose beads are already running along the wires.
 * Sliding something that is already drifting reads as two animations arguing, so those cross-fade in
 * place while everything static rises.
 */
export function Fold({
  children,
  delay = 0,
  fade = false,
  className,
}: {
  children: ReactNode
  delay?: number
  fade?: boolean
  className?: string
}) {
  return (
    <div className={`fold ${className ?? ""}`} data-fold {...(fade ? { "data-fade": "" } : {})}>
      <div className="fold-inner" style={delay ? { transitionDelay: `${delay}s` } : undefined}>
        {children}
      </div>
    </div>
  )
}
