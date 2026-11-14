import Image from "next/image"
import Link from "next/link"

import { Pricing } from "@/components/landing/Pricing"
import { StartJobFlow } from "@/components/start-job/StartJobFlow"

/**
 * Landing — restyled to the Muen house reference (muencollective.com).
 *
 * The reference's structure, kept: a full-bleed photographic hero at 100svh with the wordmark over
 * the image and one pill action; hairline-separated bands; a 36px/600 section heading at −0.03em with
 * a 14px lede beneath it; the method as numbered plate rows that open in place; the plans as three
 * cards with the action leading; then the closing band and a four-column footer.
 *
 * What is PULL's own: the copy, the runway photograph (a fixture look, not stock), the four acts the
 * method describes, and the numbers on the plans.
 */

/** The four acts, in the order the studio performs them. */
const METHOD = [
  {
    n: "01",
    title: "The looks come in.",
    body: "Drop the folder of screenshots. Pull trims the chrome, reads the look number and the season, and files every look under its house — no spreadsheet, no renaming.",
  },
  {
    n: "02",
    title: "The board is built.",
    body: "Each house gets a row of five, with the rest of the collection held in reserve. Delete a look and the row refills from the same house instead of going short.",
  },
  {
    n: "03",
    title: "The client decides.",
    body: "One link, nothing to install, no account. They approve, pass, and circle the pieces they want. Their pen becomes a layer on the board, not a reply in your inbox.",
  },
  {
    n: "04",
    title: "The requests go out.",
    body: "The agent drafts one email per showroom from the approved looks and the shoot dates. You approve it and it sends. Boxes, weights and labels follow the same board.",
  },
]

/**
 * The real product screens, as cards. Each one is a 1440-wide capture of the shipped route — evidence,
 * not illustration — sitting in the same plate as the plans, with the media panel the house uses.
 */
const SCREENS = [
  {
    n: "01",
    label: "The board",
    title: "Every look, filed by house.",
    body: "Five to a row, the rest of the collection held behind it. Remove a look and the row refills from the same house.",
    src: "/landing/screen-board.png",
    alt: "The review board: looks grouped by house, one shortlisted with a tick",
  },
  {
    n: "02",
    label: "The client link",
    title: "One link, no account.",
    body: "The client approves, passes and circles the pieces they want. Their pen lands as a layer on the board.",
    src: "/landing/screen-client.png",
    alt: "The client's page: looks approved, passed, and one circled with a red pen",
  },
  {
    n: "03",
    label: "The requests",
    title: "One email per showroom.",
    body: "The agent drafts each request from the approved looks and the shoot dates. Nothing sends until you approve it.",
    src: "/landing/screen-requests.png",
    alt: "Request emails: the agent's run, then one draft per house with the looks and shoot dates",
  },
]

/** The agent's real calls and durations, as /trace records them for one look. */
const RUN = [
  { tool: "cloudinary.trim", note: "look 27 · border trimmed", ms: 182 },
  { tool: "tesseract.read", note: "CELINE · look 27 · AW26", ms: 941 },
  { tool: "parse.look", note: "brand CELINE · look 27 · AW26", ms: 3 },
  { tool: "agent.draft", note: "CELINE · look 27", ms: 1204 },
  { tool: "resend.send", note: "CELINE · pr@celine.demo", ms: 312 },
]

const QUESTIONS = [
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

const HERO = "/fixtures/menswear/louis_vuitton_look_5_aw26.jpg"

/** A plate row that opens in place — the reference's method list, as a `<details>` so it needs no JS. */
function Row({ n, title, body }: { n?: string; title: string; body: string }) {
  return (
    <details className="group plate overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-[18px] py-[15px] [&::-webkit-details-marker]:hidden">
        {n ? (
          <span className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">{n}</span>
        ) : null}
        <span className="text-[16px] font-medium leading-snug text-foreground">{title}</span>
        <span className="ml-auto text-[16px] leading-none text-muted-foreground group-open:hidden">+</span>
        <span className="ml-auto hidden text-[16px] leading-none text-muted-foreground group-open:block">
          ×
        </span>
      </summary>
      <p className="px-[18px] pb-[16px] text-[14px] leading-[1.65] text-muted-foreground md:pl-[52px]">
        {body}
      </p>
    </details>
  )
}

export default function LandingPage() {
  return (
    <main>
      {/* Hero — the photograph is the argument; the chrome is the wordmark and one pill. */}
      <section className="relative h-[calc(100svh-64px)] min-h-[560px] overflow-hidden bg-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO}
          alt="A look from the Louis Vuitton autumn collection on the runway"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* The Muen scrim: a white lift at the top and bottom, so the photograph keeps its colour
            and the ink type over it stays legible. Never a black wash. */}
        <div className="absolute inset-0" style={{ background: "var(--scrim)" }} />

        <div className="relative flex h-full flex-col justify-between p-6 md:p-10">
          <div className="flex items-start justify-between gap-6">
            <p className="font-mono text-[11px] tracking-[0.06em] text-foreground/70">
              Selects in · Requests out
            </p>
            <p className="font-mono text-[11px] tracking-[0.06em] text-foreground/60">
              A styling studio · New York
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1 className="max-w-[18ch] text-[clamp(32px,4.2vw,56px)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground">
              From selects to confirmed looks.
            </h1>
            <StartJobFlow kind="hero" />
          </div>
        </div>
      </section>

      {/* The method. */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
          <h2 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            The Pull method.
          </h2>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.65] text-muted-foreground">
            Four acts, one board. The work that used to live in folders, screenshots and a chain of
            replies runs in a single record — and every step the agent takes is written down.
          </p>

          <div className="mt-8 flex max-w-[760px] flex-col gap-2">
            {METHOD.map((row) => (
              <Row key={row.n} n={row.n} title={row.title} body={row.body} />
            ))}
          </div>
        </div>
      </section>

      {/* The screens, as cards — the same plate as the plans, with the capture inside. */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
          <h2 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            The screens.
          </h2>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.65] text-muted-foreground">
            Three surfaces the studio actually works in, captured from the running app rather than
            drawn for this page.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {SCREENS.map((screen) => (
              <article key={screen.n} className="plate flex flex-col gap-4 p-[18px]">
                <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                  {screen.n} · {screen.label}
                </p>

                <div>
                  <h3 className="text-[16px] font-semibold leading-tight text-foreground">{screen.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{screen.body}</p>
                </div>

                {/* The capture sits in a debossed panel, as the reference treats card media. */}
                <div className="relative mt-auto aspect-[16/10] overflow-hidden rounded-[16px] bg-muted">
                  <Image
                    src={screen.src}
                    alt={screen.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The agent run, as one card: the calls it made, in order, with what each cost. */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
          <h2 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            The agent, on the record.
          </h2>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.65] text-muted-foreground">
            A pipeline, not a chat. Every step is a named tool call with its arguments, its result and
            how long it took — visible while it runs, kept afterwards.
          </p>

          <article className="plate mt-8 max-w-[760px] overflow-hidden">
            <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-3">
              <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                run · Dune Tour · look 27
              </p>
              <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                {RUN.length} calls · {RUN.reduce((total, row) => total + row.ms, 0)} ms
              </p>
            </header>

            <ol>
              {RUN.map((row, index) => (
                <li
                  key={row.tool}
                  className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-b-0"
                >
                  <span className="w-4 shrink-0 font-mono text-[11px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] leading-tight text-foreground">{row.tool}</p>
                    <p className="truncate text-[12px] leading-relaxed text-muted-foreground">{row.note}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {row.ms} ms
                  </span>
                </li>
              ))}
            </ol>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
              <p className="text-[12px] text-muted-foreground">
                Drafted by the agent. Approved by you. Then sent.
              </p>
              <Link href="/trace" className="font-mono text-[11px] tracking-[0.02em] text-brand">
                See the whole trace →
              </Link>
            </footer>
          </article>
        </div>
      </section>

      {/* The plans, as cards. */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
          <h2 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            Three ways in.
          </h2>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.65] text-muted-foreground">
            Solo, Studio and House. One seat is one stylist who signs in — the client link and the
            showroom link are free and always will be.
          </p>

          <Pricing />
        </div>
      </section>

      {/* Questions — the same open-in-place rows. */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-20">
          <h2 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            Questions.
          </h2>
          <div className="mt-8 flex max-w-[760px] flex-col gap-2">
            {QUESTIONS.map((item) => (
              <Row key={item.q} title={item.q} body={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Close. */}
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-6 py-16 md:px-10">
          <h2 className="max-w-[24ch] text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
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

      {/* Footer — four columns, as the reference. */}
      <footer className="mx-auto max-w-[1440px] px-6 py-12 md:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-[16px] font-semibold tracking-[-0.01em] text-foreground">Pull.</p>
            <p className="mt-2 max-w-[34ch] text-[13px] leading-relaxed text-muted-foreground">
              A styling studio for the whole prep loop: screenshots in, boards out, requests sent.
            </p>
          </div>

          <nav aria-label="The product" className="flex flex-col gap-2">
            <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">Studio</p>
            {[
              { label: "Board", href: "/board" },
              { label: "Client page", href: "/client" },
              { label: "Request emails", href: "/requests" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-[13px] text-foreground hover:text-muted-foreground">
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="The record" className="flex flex-col gap-2">
            <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">Record</p>
            {[
              { label: "Agent trace", href: "/trace" },
              { label: "The system", href: "/design" },
              { label: "How it is wired", href: "/setup" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-[13px] text-foreground hover:text-muted-foreground">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground">Elsewhere</p>
            <Link href="/sign-in" className="text-[13px] text-foreground hover:text-muted-foreground">
              Sign in
            </Link>
            <a
              href="mailto:studio@muencollective.com"
              className="text-[13px] text-foreground hover:text-muted-foreground"
            >
              Email
            </a>
          </div>
        </div>

        <p className="mt-12 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
          © 2026 Muen Collective
        </p>
      </footer>
    </main>
  )
}
