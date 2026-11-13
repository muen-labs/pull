import Link from "next/link"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { requireStylist } from "@/lib/auth"
import { AgentProviderBadge } from "@/components/AgentProviderBadge"

export const metadata = { title: "Pull — dashboard" }

/** Dashboard shell: the wordmark, who is signed in, and a way out. Nothing else competes. */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireStylist()

  return (
    <>
      <header className="client-top" style={{ position: "sticky", top: 0, zIndex: 20 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 24, height: 64 }}>
          <Link href="/studio" className="wordmark">
            Pull.
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <AgentProviderBadge />
            {/* The studio is an organization: this is where a stylist switches it or starts one. */}
            <OrganizationSwitcher
              hidePersonal={false}
              appearance={{ elements: { rootBox: "flex items-center" } }}
            />
            {/* Avatar menu: manage account, sign out. Clerk owns the session, so it owns the exit. */}
            <UserButton />
          </div>
        </div>
      </header>
      <main className="container" style={{ paddingTop: 40, paddingBottom: 96 }}>
        {children}
      </main>
    </>
  )
}
