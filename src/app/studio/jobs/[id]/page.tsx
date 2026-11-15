import Link from "next/link"
import { notFound } from "next/navigation"
import { requireStylist } from "@/lib/auth"
import { boardImageUrl } from "@/lib/cloudinary"
import { getJobBoard } from "@/server/queries/jobs"
import { ImportPanel } from "@/components/studio/ImportPanel"
import { setClientVerifyForm } from "@/server/actions/client-gate"

export const metadata = { title: "Pull — job" }

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** The drop zone and the ghost cards are the point of this screen: images in, sorted images out. */
export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const stylist = await requireStylist()
  const { id } = await params
  const data = await getJobBoard(stylist.id, id)
  if (!data) notFound()

  const { job, boards, visibleLookCount } = data

  return (
    <div className="stack" style={{ gap: 26 }}>
      <div>
        <Link href="/studio" className="mono" style={{ color: "var(--muted-foreground)" }}>
          ← DASHBOARD
        </Link>
        <header style={{ marginTop: 16 }}>
          <p className="eyebrow">{job.clientName}</p>
          <h1 className="display" style={{ margin: "10px 0 0", fontSize: "clamp(28px, 4vw, 42px)" }}>
            {job.title}
          </h1>
          <p className="small" style={{ marginTop: 10 }}>
            {formatDate(job.shootDate)} · {job.clientEmail ?? "no contact email"}
            {visibleLookCount > 0 ? ` · ${visibleLookCount} images · ${boards.length} brands` : ""}
          </p>
        </header>
      </div>

      <section aria-label="Client link access" className="plate" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Client link</p>
            <p className="small" style={{ margin: "6px 0 0" }}>
              {job.clientVerify
                ? "The client confirms their email once per device before the board opens. Forwarded links stay shut."
                : "Anyone with the link can open the board. Turn this on for clients under NDA."}
            </p>
          </div>
          <form action={setClientVerifyForm}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="enabled" value={job.clientVerify ? "0" : "1"} />
            <button type="submit" className={job.clientVerify ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}>
              {job.clientVerify ? "Turn email check off" : "Turn email check on"}
            </button>
          </form>
        </div>
      </section>

      <ImportPanel jobId={job.id} />

      {visibleLookCount === 0 ? (
        <section aria-label="Waiting for images">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <p className="eyebrow">Waiting for images</p>
            <span className="mono" style={{ color: "var(--muted-foreground-soft)", fontSize: 10 }}>
              NOTHING SORTED YET
            </span>
          </div>
          <p className="small" style={{ margin: "8px 0 16px" }}>
            Drop a folder or single images above. The agent uploads each one, reads the look number
            and season, and files it under its brand.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 14,
            }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <GhostCard key={index} />
            ))}
          </div>
        </section>
      ) : (
        <div className="stack" style={{ gap: 30 }}>
          {boards.map((board) => (
            <section key={board.id} aria-label={board.brand}>
              <div
                className="row"
                style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8, alignItems: "baseline" }}
              >
                <h2 className="brand-name" style={{ margin: 0 }}>
                  {board.brand}
                </h2>
                <span className="mono" style={{ color: "var(--muted-foreground-soft)", fontSize: 10 }}>
                  {board.looks.length} LOOK{board.looks.length === 1 ? "" : "S"}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 14,
                  marginTop: 14,
                }}
              >
                {board.looks.map((look) => (
                  <article key={look.id} className="card" style={{ padding: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={boardImageUrl(look.imagePublicId ?? look.sourcePublicId ?? "", 600)}
                      alt={`Look ${look.lookNo}${look.season ? ` — ${look.season}` : ""}, ${look.brand}`}
                      width={600}
                      height={800}
                      loading="lazy"
                      style={{ display: "block", width: "100%", aspectRatio: "3 / 4", objectFit: "cover", borderRadius: 8 }}
                    />
                    <p className="mono" style={{ fontSize: 10, letterSpacing: ".08em", margin: "8px 2px 2px", color: "var(--muted-foreground)" }}>
                      LOOK {look.lookNo}
                      {look.season ? ` · ${look.season}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** An empty tile in the shape of a look — the "ghost card" that fills once images are sorted. */
function GhostCard() {
  return (
    <div
      style={{
        border: "1px dashed var(--line-strong)",
        borderRadius: 12,
        background: "var(--paper-2)",
        padding: 8,
      }}
      aria-hidden="true"
    >
      <div style={{ aspectRatio: "3 / 4", borderRadius: 8, background: "linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%)" }} />
      <div style={{ height: 8, width: "55%", borderRadius: 4, background: "var(--line)", margin: "10px 2px 4px" }} />
    </div>
  )
}
