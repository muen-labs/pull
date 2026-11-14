"use client"

/**
 * The scroll trigger for the fold reveal — see `[data-fold]` in globals.css for the mechanic.
 *
 * The trap this is written around: a block that never receives `.is-visible` is not un-animated, it is
 * *invisible* — it sits one block-height below its clipping wrapper. So two rules hold:
 *
 * 1. **Anything on screen at mount is revealed immediately**, whatever the band says. A block parked
 *    on the viewport edge would otherwise be deleted.
 * 2. **Observation stays live.** The state is set from `isIntersecting` on every entry, so scrolling
 *    back re-runs the entrance — that is what makes it scroll-triggered rather than once-only.
 *
 * The band is `-10%` top and bottom so a block straddling the edge does not flicker, and the threshold
 * is low enough that tall blocks (the plans run most of a screen) still fire.
 */
import { useEffect } from "react"

export function RevealObserver() {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-fold]"))

    const setVisible = (el: HTMLElement, visible: boolean) => {
      el.classList.toggle("is-visible", visible)
    }

    if (!("IntersectionObserver" in window)) {
      blocks.forEach((el) => setVisible(el, true))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.target as HTMLElement, entry.isIntersecting)
      },
      { threshold: 0.15, rootMargin: "-10% 0px -10% 0px" },
    )

    for (const block of blocks) {
      const box = block.getBoundingClientRect()
      // On screen already: settle it before the observer has an opinion.
      if (box.top < window.innerHeight && box.bottom > 0) {
        requestAnimationFrame(() => setVisible(block, true))
        continue
      }
      observer.observe(block)
    }

    return () => observer.disconnect()
  }, [])

  return null
}
