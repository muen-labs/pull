"use client"

/**
 * Act 3 of the landing demo: the request emails, built from the approvals the client just sent.
 *
 * One draft per brand that has approved looks, carrying the client, the job and the delivery date.
 * With no review in this tab it shows the seeded design surface; a board that has not been approved
 * yet says it is waiting rather than showing someone else's emails.
 *
 * Where it reads from: `board-store` holds the board the stylist built, `approved-store` holds what
 * the client decided — the same record the bell, /approved and the studio read. This screen owns no
 * storage of its own: it is a view over those two, so the demo's acts cannot drift apart.
 */
import Link from "next/link"
import { useEffect, useState } from "react"

import { readApproval } from "@/lib/approved-store"
import { readStoredBoard } from "@/lib/board-store"

import { RequestEmails, type RequestBrand, type RequestJob } from "./RequestEmails"

function contactFor(brand: string): string {
  return `pr@${brand.toLowerCase().replace(/[^a-z]/g, "")}.demo`
}

interface RequestsView {
  job: RequestJob
  brands: RequestBrand[]
  demo: boolean
  waiting: boolean
}

/** The landing form has one date; the draft repeats it as the shoot window. */
function jobFrom(title: string, client: string, dueDate: string): RequestJob {
  return {
    client,
    title,
    shootDate: dueDate,
    callInDate: dueDate,
    returnDate: dueDate,
    shipTo: "Pull Studio · 12 Mercer St, New York, NY 10013",
  }
}

export function RequestsFromReview({
  fallbackJob,
  fallbackBrands,
}: {
  fallbackJob: RequestJob
  fallbackBrands: RequestBrand[]
}) {
  const [view, setView] = useState<RequestsView | null>(null)

  useEffect(() => {
    const board = readStoredBoard()
    const record = readApproval()

    // The design surface, untouched: no board was built in this session.
    if (!board) {
      setView({ job: fallbackJob, brands: fallbackBrands, demo: false, waiting: false })
      return
    }

    const job = jobFrom(board.job.title, board.job.description, board.job.dueDate)

    // A board exists, but the client has not sent anything back yet.
    if (!record) {
      setView({ job, brands: [], demo: true, waiting: true })
      return
    }

    const byBrand = new Map<string, RequestBrand>()
    for (const look of record.looks) {
      const entry = byBrand.get(look.brand) ?? {
        brand: look.brand,
        contactEmail: contactFor(look.brand),
        looks: [],
      }
      entry.looks.push({
        id: look.id,
        lookNo: look.lookNo,
        season: look.season,
        src: look.image,
      })
      byBrand.set(look.brand, entry)
    }
    setView({ job, brands: [...byBrand.values()], demo: true, waiting: false })
    // The fallbacks are server-rendered once for this page; read the stores once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!view) {
    return (
      <main className="mx-auto max-w-[1440px] px-6 py-16 md:px-10">
        <p className="text-[13px] text-muted-foreground">Opening the requests…</p>
      </main>
    )
  }

  const approvedLooks = view.brands.reduce((total, brand) => total + brand.looks.length, 0)

  return (
    <>
      {view.demo ? (
        <div className="border-b border-border bg-muted">
          <p className="mx-auto max-w-[1440px] px-6 py-2 text-[11px] tracking-[0.02em] text-muted-foreground md:px-10">
            {view.waiting ? (
              <>
                Waiting on the client — no approvals submitted yet.{" "}
                <Link href="/client" className="underline underline-offset-2">
                  Open the client page →
                </Link>
              </>
            ) : (
              <>
                From {view.job.client}&apos;s approvals — {approvedLooks} look
                {approvedLooks === 1 ? "" : "s"} across {view.brands.length} brand
                {view.brands.length === 1 ? "" : "s"}. Draft one email per house, then send.
              </>
            )}
          </p>
        </div>
      ) : null}
      <RequestEmails job={view.job} brands={view.brands} />
    </>
  )
}
