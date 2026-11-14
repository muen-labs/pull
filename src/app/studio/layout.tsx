import Link from "next/link"
import { OrganizationSwitcher, SignOutButton, UserButton } from "@clerk/nextjs"

import { requireStylist } from "@/lib/auth"
import { AgentProviderBadge } from "@/components/AgentProviderBadge"

export const metadata = { title: "Pull — dashboard" }

/**
 * Dashboard shell: the wordmark, which studio you are in, and three ways out of the session.
 *
 * The header is a LIGHT hairline bar, not the client page's dark material (`.client-top`): the studio
 * is the editorial surface, and the dark header put the ink wordmark on a dark ground — "Pull." was
 * black on near-black. It is sticky at `top: 0`, so it must be the first thing in the flow: the demo
 * guide is suppressed on `/studio` for exactly that reason (it narrated the acts and sat above this).
 *
 * Sign-out is stated, not implied. `<UserButton />` holds it in its menu, but a stylist should not
 * have to discover a menu to leave, so a labelled button sits beside the avatar.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireStylist()

  return (
    <>
      <header
        style={{ position: "sticky", top: 0, zIndex: 20 }}
        className="border-b border-border bg-background/90 backdrop-blur-sm"
      >
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 24, height: 64 }}>
          <Link href="/studio" className="wordmark">
            Pull.
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <AgentProviderBadge />
            {/* Which studio: switching, creating, inviting. Personal account is the no-org case. */}
            <OrganizationSwitcher
              hidePersonal={false}
              appearance={{ elements: { rootBox: "flex items-center" } }}
            />
            {/* The avatar menu: manage account. */}
            <UserButton />
            {/* The exit, stated. */}
            <SignOutButton redirectUrl="/sign-in">
              <button type="button" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>
      <main className="container" style={{ paddingTop: 40, paddingBottom: 96 }}>
        {children}
      </main>
    </>
  )
}
