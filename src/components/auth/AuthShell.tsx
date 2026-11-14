/**
 * The sign-in screen's frame — the product's own voice around Clerk's form.
 *
 * Clerk ships a rounded, shadowed card tuned for a generic SaaS. PULL has no radius anywhere ("the
 * references have no radius", globals.css §buttons) and carries weight with hairlines and type, not
 * shadows. So the card is squared, bordered, and sits on the muted surface; the wordmark and the copy
 * come from us, and the form is Clerk's.
 *
 * The copy answers the one question this page has to: is this for me? Stylists sign in; clients never
 * do — they open a link. Saying that here stops a client who wandered in from trying to make an
 * account.
 */
import Link from "next/link"

export function AuthShell({
  eyebrow,
  title,
  emphasis,
  body,
  children,
}: {
  eyebrow: string
  title: string
  /** The one word in the title that takes the muted second colour. */
  emphasis?: string
  body: string
  children: React.ReactNode
}) {
  const [before, after] = emphasis ? title.split(emphasis) : [title, ""]

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-background md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex flex-col justify-between gap-10 border-border px-6 py-8 md:border-r md:px-12 md:py-12">
        <Link href="/" className="wordmark">
          Pull.
        </Link>

        <div className="max-w-[460px]">
          <p className="text-[11px] tracking-[0.02em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-6 text-[clamp(34px,4.2vw,56px)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground">
            {before}
            {emphasis ? <span className="text-muted-foreground-soft">{emphasis}</span> : null}
            {after}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
        </div>

        <p className="max-w-[380px] text-[11px] leading-relaxed tracking-[0.02em] text-muted-foreground-soft">
          Clients never sign in. The link you send them opens on its own — no account, no password.
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12 md:px-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </section>
    </main>
  )
}
