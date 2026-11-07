"use client"

/**
 * The client's page, carrying the board the stylist just built.
 *
 * `/client` is a design surface: the real client link is `/b/[token]`. But the demo's continuity
 * matters — a board built at `/` and handed to `/board` should be the board the client opens, not
 * the seeded fixture set. So this wrapper reads the built board (sessionStorage, written by the
 * start-job dialog) on mount and renders `ClientBoard` against it; with no built board it falls back
 * to the server-seeded looks, which keeps the route shareable and reviewable on its own.
 *
 * The built board arrives after mount (sessionStorage is client-only), so the page holds a quiet
 * placeholder rather than flashing the seeded board and swapping it.
 */
import { useEffect, useState } from "react"

import type { Look } from "@/components/start-job/ReviewBoard"
import { readStoredBoard } from "@/lib/board-store"
import { ClientBoard, type ClientBoardJob } from "./ClientBoard"

interface ClientView {
  job: ClientBoardJob
  looks: Look[]
}

export function ClientBoardPage({
  defaultJob,
  defaultLooks,
}: {
  defaultJob: ClientBoardJob
  /** Server-seeded looks, used when no board was built in this session. */
  defaultLooks: Look[]
}) {
  const [view, setView] = useState<ClientView | null>(null)

  useEffect(() => {
    const saved = readStoredBoard()
    if (!saved) {
      setView({ job: defaultJob, looks: defaultLooks })
      return
    }
    setView({
      job: {
        title: saved.job.title,
        client: saved.job.description,
        dueDate: saved.job.dueDate,
      },
      // A stored look may only carry `source`; the board and the approval record render `src`.
      looks: saved.looks.map((look) => ({
        ...look,
        status: "ready" as const,
        src: look.src ?? (typeof look.source === "string" ? look.source : undefined),
      })),
    })
  }, [defaultJob, defaultLooks])

  if (!view) {
    return <div className="min-h-dvh bg-background" aria-busy="true" aria-label="Opening the looks" />
  }

  return <ClientBoard job={view.job} looks={view.looks} />
}
