"use client"

/**
 * Entrance motion for the landing sections — the house recipe, not a library.
 *
 * Each `[data-reveal]` section starts 26px low and 4% small at zero opacity, and settles the first
 * time it scrolls into view (threshold 0.1, with a −40px bottom margin so it fires just inside the
 * fold). Sections already on screen at load — the hero — settle immediately instead of animating
 * under the reader.
 *
 * The observer only adds a class; the transition lives in CSS, so `prefers-reduced-motion` and the
 * no-JS case are one rule each rather than a code path here.
 */
import { useEffect } from "react"

export function RevealObserver() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    const settle = (el: Element) => el.classList.add("is-visible")

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || !("IntersectionObserver" in window)) {
      sections.forEach(settle)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          settle(entry.target)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    )

    for (const section of sections) {
      // Already in the first screen: no animation, it would play before the eye arrives.
      if (section.getBoundingClientRect().top < window.innerHeight * 0.85) settle(section)
      else observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  return null
}
