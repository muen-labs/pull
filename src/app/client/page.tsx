/**
 * /client — the client's page, as a design surface.
 *
 * The real client link is /b/[token] (signed, DB-backed, approve/pass persisted).
 * This route renders the same layout against the seeded fixture set so the
 * surface can be designed without publishing a board: decisions are local, and
 * "Send approvals" only acknowledges.
 */
import { ClientBoardPage } from "@/components/client-view/ClientBoardPage"
import { seededLooks } from "@/lib/fixtures"

export const metadata = {
  title: "Pull — your looks",
  robots: { index: false, follow: false },
}

export default function ClientPage() {
  return (
    <ClientBoardPage
      defaultJob={{ title: "Dune Tour", client: "Timothée Chalamet", dueDate: "2027-12-01" }}
      defaultLooks={seededLooks()}
    />
  )
}
