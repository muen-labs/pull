import { readFileSync } from "node:fs"
import { join } from "node:path"
import Link from "next/link"

import { AgentTraceReel, type TraceRow } from "@/components/landing/AgentTraceReel"
import { RevealObserver } from "@/components/landing/RevealObserver"
import { ScreenCarousel, type ScreenStep } from "@/components/landing/ScreenCarousel"
import { Pricing } from "@/components/landing/Pricing"
import { LookMarquee } from "@/components/LookMarquee"
import { StartJobFlow } from "@/components/start-job/StartJobFlow"

interface SuggestionRow {
  file: string
  brand: string
}

/** One look per house for the strip under the fold. */
function stripImages(): string[] {
  try {
    const path = join(process.cwd(), "public", "fixtures", "menswear", "manifest.json")
    const manifest = JSON.parse(readFileSync(path, "utf8")) as { assets?: SuggestionRow[] }
    const seen = new Map<string, number>()
    const picks: string[] = []
    for (const row of manifest.assets ?? []) {
      const used = seen.get(row.brand) ?? 0
      if (used >= 2) continue // two per house keeps the loop varied
      seen.set(row.brand, used + 1)
      picks.push(`/fixtures/menswear/${encodeURIComponent(row.file)}`)
      if (picks.length === 12) break
    }
    return picks
  } catch {
    return []
  }
}

/** The three moves, each with the real screen it produces, recorded as a GIF from that route. */
const STEPS: ScreenStep[] = [
  {
    n: "01",
    title: "Read the runway",
    body: "Drop the folder of screenshots. Pull trims the image, reads the look number and the season, and files every look under its brand.",
    label: "The board — every look, filed by house",
    gif: "/landing/demo-board.gif",
    alt: "The board: looks grouped by house, one shortlisted, one in a hairline grid",
  },
  {
    n: "02",
    title: "Send one link",
    body: "Your client opens it with nothing to install and no account. They prioritize what they love and circle the pieces they actually want.",
    label: "The client's page — approve, pass, circle",
    gif: "/landing/demo-client.gif",
    alt: "The client's page: looks approved, passed and circled with a red pen",
  },
  {
    n: "03",
    title: "Send the requests out",
    body: "The agent drafts emails per showroom with the approved looks and the shoot details. You approve it and it sends. Boxes, weights and labels follow the same board.",
    label: "Request emails — one per showroom, drafted",
    gif: "/landing/demo-requests.gif",
    alt: "Request emails: the agent's run, then one draft per house with the looks and shoot dates",
  },
  {
    n: "04",
    title: "The showroom sends it back",
    body: "The showroom opens the same kind of link, enters the parcel and the pickup, and the courier options come back priced. The prepaid label returns to the studio — nothing is bought from their side.",
    label: "The showroom — parcel, pickup, prepaid label",
    gif: "/landing/demo-intake.gif",
    alt: "The showroom intake: the label request, the parcel, and the pickup details",
  },
]

/**
 * The references the canvas starts from, and the look it rendered on production.
 *
 * `final-look.jpg` is a real gpt-image-2 output captured from /canvas (a 1024² render), not a
 * mock-up: the client on the left is worn through the jacket, top and trousers that follow.
 */
const CANVAS_REFS = [
  {
    ref: "ref 1",
    name: "the jacket",
    src: "/fixtures/menswear/prada_look_1_aw26.jpg",
    alt: "The jacket",
    mark: null,
  },
  {
    ref: "ref 2",
    name: "the top",
    src: "/fixtures/menswear/dior_homme_look_1_aw26.jpg",
    alt: "The top, ringed by the stylist",
    // Drawn in the card's own 100×150 space, over the sequined top the Dior look actually wears.
    mark: "M30 34C34 18 66 14 72 30C76 44 70 66 57 70C43 74 30 61 30 47C30 41 30 37 30 34",
  },
  {
    ref: "ref 3",
    name: "the trousers",
    src: "/fixtures/menswear/louis_vuitton_look_4_aw26.jpg",
    alt: "The trousers, ringed by the stylist",
    // The cream wide-leg trousers under the coat, which is where the pen lands.
    mark: "M35 83C41 74 62 74 66 85C70 101 70 127 57 135C43 142 32 131 32 113C32 100 33 90 35 83",
  },
]

/**
 * The three noodles between the references and the final. `d` is drawn in the 96×510 gap next to the
 * cards, so the endpoints are the reference's edge and the final's edge — see the geometry note there.
 * The marked piece's wire carries the markup ink; the beads inherit it.
 */
const NOODLES = [
  { id: "noodle-jacket", d: "M0 87C44 87 34 255 96 255", stroke: "var(--border)" },
  { id: "noodle-top", d: "M0 255H96", stroke: "var(--markup)" },
  { id: "noodle-trousers", d: "M0 423C44 423 34 255 96 255", stroke: "var(--markup)" },
]

/** Real tool names and durations, as they appear on /trace. */
const TRACE: TraceRow[] = [
  { tool: "cloudinary.trim", note: "look 27 · border trimmed", ms: 182 },
  { tool: "tesseract.read", note: "CELINE · LOOK 27 · AW26", ms: 941 },
  { tool: "parse.look", note: "brand CELINE · look 27 · AW26", ms: 3 },
  { tool: "agent.draft", note: "CELINE · look 27", ms: 1204 },
  { tool: "resend.send", note: "CELINE · pr@celine.demo", ms: 312 },
]

const FAQ = [
  {
    q: "Do my clients need an account?",
    a: "No. The link is the board — nothing to install, nothing to log in to. Showrooms work the same way: a link, not a login.",
  },
  {
    q: "What counts as a seat?",
    a: "A stylist who signs in. Clients and showrooms never take a seat, so a studio only pays for the people doing the work.",
  },
  {
    q: "Who sends the showroom emails?",
    a: "The agent drafts one per showroom from the approved looks. Nothing leaves the studio until you approve it, and every step it took stays on the record.",
  },
  {
    q: "What happens to the screenshots?",
    a: "They stay in your workspace with the looks they produced, filed by house and readable at any time. Delete a job and its images go with it.",
  },
]

const FOOTER_LINKS = [
  { label: "Board", href: "/board" },
  { label: "Client page", href: "/client" },
  { label: "Request emails", href: "/requests" },
  { label: "Agent trace", href: "/trace" },
]

/**
 * Landing — the product page.
 *
 * Visual direction: vende.framer.media for the type (a display scale that runs
 * past 120px, tight negative tracking, near-black on near-white, one accent) and
 * Dover Street Market for the density (full-bleed image band, hairline rules,
 * small labels doing the quiet work). The screens in `public/landing` are the
 * real ones, captured at 1440 — evidence, not illustration.
 *
 * Written for the productised app, not the hackathon demo: plans, seats, and the
 * client/showroom links as the story.
 */
export default function LandingPage() {
  const strip = stripImages()

  return (
    <main className="landing">
      <RevealObserver />
      {/* Without JS the observer never runs, so the sections must not stay hidden. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1;transform:none}`}</style>
      </noscript>
      <section data-reveal className="mx-auto max-w-[1440px] px-6 pt-14 md:px-10 md:pt-20">
        <h1 className="mt-8 text-[clamp(52px,8.6vw,128px)] font-bold leading-[0.88] tracking-[-0.06em] text-foreground">
          From selects to confirmed looks.
        </h1>

        {/* The action sits above the rule; the rule introduces the note. */}
        <div className="mt-10">
          <StartJobFlow kind="hero" />
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="max-w-[440px] text-[15px] leading-relaxed text-muted-foreground">
            Pull. guides you through the entire process of prep. It reads every look, builds styling
            boards, and sends off for client approval — then turns those approvals into pre-styled
            mockups, showroom requests, and shipping labels.
          </p>
        </div>
      </section>

      {/* Endless strip: the clothes are the argument, the chrome is hairline.
          Grab it and slide it; the side gutters are blur filters pinned over the
          band, not empty margins — a look leaves the frame out of focus. */}
      {strip.length ? (
        <LookMarquee srcs={strip} className="mt-16 border-t border-border md:mt-24" />
      ) : null}

      {/* How it works, with the screens moving. */}
      <section data-reveal className="mx-auto max-w-[1440px] px-6 pt-20 md:px-10 md:pt-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">How it works</p>
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">
            Four moves, one record
          </p>
        </div>

        <h2 className="mt-8 max-w-[16ch] text-[clamp(32px,4.6vw,64px)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground">
          Selects in. Requests out.
        </h2>

        <ScreenCarousel steps={STEPS} />
      </section>

      {/* The canvas: the marked references in, one large final card out. */}
      <section data-reveal className="mx-auto max-w-[1440px] px-6 pt-20 md:px-10 md:pt-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">The canvas</p>
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">Mock-up, then try it on</p>
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:items-start md:gap-14">
          <div>
            <h2 className="max-w-[16ch] text-[clamp(30px,3.6vw,44px)] font-semibold leading-[1] tracking-[-0.035em] text-foreground">
              Mock up the outfit. Put it on the client.
            </h2>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
              Three pieces in — the jacket, the top, the trousers. Ring the one you mean and the
              agent writes the prompt, then puts the outfit on a model. The render beside them is one
              this canvas actually produced.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link href="/canvas" className="btn btn-ghost">
                Open the canvas
              </Link>
            </div>
          </div>

          <div>
            {/* Three references on the left, one noodle each, into the 2:3 final on the right.
                Fixed geometry so the curves actually land on both cards: refs 96×144, a 96×510 gap,
                final 340×510. The wires are SVG paths with no fill — the marked piece carries the
                magenta, the rest the hairline. */}
            <div className="hidden items-center justify-center md:flex">
              <div className="flex flex-col justify-center gap-6">
                {CANVAS_REFS.map((ref) => (
                  <figure key={ref.name} className="w-[96px]">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-[12px] bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ref.src}
                        alt={ref.alt}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                      {ref.mark ? (
                        <svg
                          viewBox="0 0 100 150"
                          preserveAspectRatio="none"
                          aria-hidden
                          className="pointer-events-none absolute inset-0 h-full w-full"
                        >
                          <path
                            d={ref.mark}
                            fill="none"
                            stroke="var(--markup)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                          />
                        </svg>
                      ) : null}
                    </div>
                    <figcaption className="pt-2 font-mono text-[10px] tracking-[0.02em] text-muted-foreground">
                      {ref.ref} · {ref.name}
                    </figcaption>
                  </figure>
                ))}
              </div>

              <svg width="96" height="510" viewBox="0 0 96 510" fill="none" aria-hidden className="shrink-0">
                {NOODLES.map((noodle) => (
                  <path
                    key={noodle.id}
                    id={noodle.id}
                    d={noodle.d}
                    stroke={noodle.stroke}
                    strokeWidth="1"
                  />
                ))}

                {/* Beads: three per noodle, spaced a third of the cycle apart, so each wire reads as a
                    current flowing from the reference into the render. SMIL follows the path itself,
                    which means the motion stays on the curve at any geometry. */}
                <g className="noodle-beads">
                  {NOODLES.map((noodle) =>
                    [0, 1, 2].map((index) => (
                      <circle
                        key={`${noodle.id}-${index}`}
                        r="2.4"
                        fill={noodle.stroke === "var(--border)" ? "var(--muted-foreground)" : noodle.stroke}
                        opacity={1 - index * 0.3}
                      >
                        <animateMotion
                          dur="2.6s"
                          begin={`${-index * 0.86}s`}
                          repeatCount="indefinite"
                          calcMode="linear"
                        >
                          <mpath href={`#${noodle.id}`} />
                        </animateMotion>
                      </circle>
                    )),
                  )}
                </g>
              </svg>

              <figure className="w-[340px] shrink-0">
                <div className="relative aspect-[2/3] overflow-hidden rounded-[16px] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/landing/final-look-2x3.jpg"
                    alt="The rendered look: the client wearing the three pieces on a runway"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="flex flex-wrap items-baseline justify-between gap-2 px-0.5 pt-3">
                  <span className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                    look-27-v1.png
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                    gpt-image-2 · the client, wearing all three
                  </span>
                </figcaption>
              </figure>
            </div>

            {/* Narrow: the same pieces stacked, without the wires. */}
            <div className="md:hidden">
              <div className="grid grid-cols-3 gap-2">
                {CANVAS_REFS.map((ref) => (
                  <div key={ref.name} className="relative aspect-[2/3] overflow-hidden rounded-[12px] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ref.src}
                      alt={ref.alt}
                      className="h-full w-full object-cover object-top"
                      loading="lazy"
                    />
                    {ref.mark ? (
                      <svg
                        viewBox="0 0 100 150"
                        preserveAspectRatio="none"
                        aria-hidden
                        className="pointer-events-none absolute inset-0 h-full w-full"
                      >
                        <path
                          d={ref.mark}
                          fill="none"
                          stroke="var(--markup)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                      </svg>
                    ) : null}
                  </div>
                ))}
              </div>
              <figure className="mt-3">
                <div className="relative mx-auto aspect-[2/3] w-[240px] overflow-hidden rounded-[16px] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/landing/final-look-2x3.jpg"
                    alt="The rendered look: the client wearing the three pieces on a runway"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-2 text-center font-mono text-[10px] tracking-[0.02em] text-muted-foreground">
                  gpt-image-2 · the client, wearing all three
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* The agent, on the record. */}
      <section data-reveal className="mx-auto max-w-[1440px] px-6 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-10 border-t border-border pt-8 md:grid-cols-2 md:gap-16">
          <div>
            <p className="text-[11px] tracking-[0.02em] text-muted-foreground">The agent</p>
            <h2 className="mt-5 max-w-[14ch] text-[clamp(28px,3.6vw,48px)] font-semibold leading-[1] tracking-[-0.035em] text-foreground">
              A pipeline, not a chat.
            </h2>
            <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground">
              Every step the agent takes is a named tool call with its arguments, its result and how
              long it took — visible while it runs, and kept afterwards. The agent drafts; you approve;
              then it sends.
            </p>
          </div>

          <div className="self-start">
            <article className="plate p-[18px]">
              <AgentTraceReel rows={TRACE} />
            </article>
          </div>
        </div>
      </section>

      {/* Plans. */}
      <section data-reveal className="mx-auto max-w-[1440px] px-6 pt-20 md:px-10 md:pt-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">Plans</p>
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">Cancel any time</p>
        </div>

        <h2 className="mt-8 max-w-[18ch] text-[clamp(32px,4.6vw,64px)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground">
          Priced per stylist.
        </h2>

        <Pricing />
      </section>

      {/* Questions. */}
      <section data-reveal className="mx-auto max-w-[1440px] px-6 pt-20 md:px-10 md:pt-28">
        <div className="border-b border-border pb-3">
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">Questions</p>
        </div>

        <div className="mt-8 grid gap-x-16 gap-y-8 md:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.q} className="border-t border-border pt-4">
              <h3 className="text-[16px] font-medium leading-snug tracking-[-0.01em] text-foreground">
                {item.q}
              </h3>
              <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Close. */}
      <section data-reveal className="mx-auto max-w-[1440px] px-6 pt-20 md:px-10 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-8 border-t border-border pt-8">
          <h2 className="max-w-[16ch] text-[clamp(34px,5vw,72px)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground">
            Start with a folder of screenshots.
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <StartJobFlow kind="hero" />
            <Link href="/board" className="btn btn-ghost">
              See a board
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-20 flex max-w-[1440px] flex-wrap items-end justify-between gap-6 border-t border-border px-6 py-10 md:px-10">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">
            Real labels · Real email · No client login
          </p>
          <nav aria-label="The product" className="flex flex-wrap gap-x-4 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] tracking-[0.02em] text-foreground hover:text-muted-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-[11px] tracking-[0.02em] text-muted-foreground">New York</p>
      </footer>
    </main>
  )
}
