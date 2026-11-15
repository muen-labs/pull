import Link from "next/link"
import { requireStylist } from "@/lib/auth"
import { SignOutButton } from "@clerk/nextjs"
import { AgentProviderBadge } from "@/components/AgentProviderBadge"

export const metadata = { title: "Pull — dashboard" }

/** Dashboard shell: the wordmark, who is signed in, and a way out. Nothing else competes. */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const stylist = await requireStylist()

  return (
    <>
      <header className="client-top" style={{ position: "sticky", top: 0, zIndex: 20 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 24, height: 64 }}>
          <Link href="/studio" className="wordmark">
            Pull.
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <AgentProviderBadge />
            <span className="mono" style={{ color: "var(--muted-foreground-soft)" }}>
              {stylist.email}
            </span>
            <SignOutButton>
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
