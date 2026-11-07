/**
 * The PRISM widget — the model calls a ZooWork agent made, in PRISM's dark instrument panel.
 *
 * PRISM (Block Convey) mirrors model calls: one row per exchange, with the model, the latency and
 * the outcome. This widget is that mirror, on screen wherever a ZooWork agent runs — the studio
 * canvas (vision + image), the request-drafting screen, the suggest-looks research. It is
 * deliberately the one dark block on a light page: an instrument, not content.
 *
 * It always names the sponsor, because on this product both model slots — the LLM and the image
 * model — are ZooWork's, on one key. Reading it left to right: who mirrored the run, which two
 * models the sponsor provides, then one row per call.
 *
 * Tokens only: the dark lookbook material (`--dark*`) is a fixed palette in the theme, not a mode.
 */
import {
  modelAliasShort,
  modelLabel,
  prismFailed,
  prismRunning,
  prismTotalMs,
  ZOOWORK_SPONSOR,
  type PrismCall,
  type PrismModels,
} from "@/lib/agent/prism-calls"
import { formatMs } from "@/lib/agent/trace"

function ModelCell({ kind, model }: { kind: "LLM" | "IMAGE"; model?: string }) {
  return (
    <div
      style={{
        minWidth: 0,
        border: "1px solid var(--dark-line)",
        background: "var(--dark-2)",
        padding: "6px 8px",
      }}
    >
      <p
        className="mono"
        style={{ margin: 0, fontSize: 8.5, letterSpacing: ".08em", color: "var(--dark-muted)" }}
      >
        {kind}
      </p>
      <p
        className="mono"
        style={{
          margin: "2px 0 0",
          fontSize: 10.5,
          lineHeight: 1.3,
          color: "var(--dark-text)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={model ?? "no model on this run"}
      >
        {modelLabel(model)}
      </p>
      <p
        className="mono"
        style={{
          margin: "1px 0 0",
          fontSize: 8.5,
          lineHeight: 1.3,
          color: "var(--dark-muted)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={model ?? undefined}
      >
        {modelAliasShort(model)}
      </p>
    </div>
  )
}

function CallRow({ call }: { call: PrismCall }) {
  const running = call.status === "running"
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "6px minmax(0, 1fr) auto",
        columnGap: 8,
        rowGap: 1,
        alignItems: "baseline",
        padding: "5px 0",
        borderTop: "1px solid var(--dark-line)",
      }}
    >
      <span
        aria-hidden
        className={running ? "motion-safe:animate-pulse" : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          transform: "translateY(-1px)",
          background: call.status === "error" ? "var(--dark-line-strong)" : "var(--dark-ok)",
        }}
      />
      <span
        className="mono"
        style={{
          minWidth: 0,
          fontSize: 10.5,
          lineHeight: 1.3,
          color: "var(--dark-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={call.tool}
      >
        {call.tool}
      </span>
      <span
        className="mono"
        style={{ fontSize: 9, letterSpacing: ".02em", color: "var(--dark-muted)", whiteSpace: "nowrap" }}
      >
        {running ? "running" : call.status === "error" ? "failed" : formatMs(call.durationMs)}
      </span>
      <span
        className="mono"
        style={{
          gridColumn: "2 / -1",
          minWidth: 0,
          fontSize: 9,
          lineHeight: 1.4,
          color: "var(--dark-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={call.error ?? call.note ?? undefined}
      >
        {call.error ? `${call.note ? `${call.note} — ` : ""}${call.error}` : call.note}
        {call.model ? ` · ${modelLabel(call.model)}` : ""}
      </span>
    </li>
  )
}

export function PrismTraceWidget({
  calls,
  models,
  sinkConfigured,
  title = "PRISM · trace mirror",
  recorded = false,
  compact = false,
  onDismiss,
}: {
  calls: PrismCall[]
  /** The two model slots the sponsor provides on this deployment. */
  models: PrismModels
  /** True when PRISMTRACE_HOST/PROJECT_ID/API_KEY are all set on this deployment. */
  sinkConfigured: boolean
  title?: string
  /** A replay of a recorded run, not a live one — said on the panel so it cannot mislead. */
  recorded?: boolean
  /** Narrow variant for the studio canvas overlay. */
  compact?: boolean
  onDismiss?: () => void
}) {
  if (calls.length === 0) return null

  const failed = prismFailed(calls)
  const running = prismRunning(calls)
  const total = prismTotalMs(calls)
  const modelCalls = calls.filter((call) => call.kind !== "tool").length

  return (
    <section
      aria-label={title}
      data-testid="prism-widget"
      style={{
        width: "100%",
        background: "var(--dark)",
        color: "var(--dark-text)",
        border: "1px solid var(--dark-line)",
        padding: compact ? "10px 12px 9px" : "14px 16px 12px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          borderBottom: "1px solid var(--dark-line)",
          paddingBottom: 8,
        }}
      >
        <span
          className="mono"
          style={{ fontSize: 10, letterSpacing: ".02em", color: "var(--dark-muted)" }}
        >
          {title}
        </span>
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 9,
            letterSpacing: ".02em",
            color: "var(--dark-muted)",
            whiteSpace: "nowrap",
          }}
          title="PRISM mirrors the run only when PRISMTRACE_HOST · PRISMTRACE_PROJECT_ID · PRISMTRACE_API_KEY are set."
        >
          <span
            aria-hidden
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: sinkConfigured ? "var(--dark-ok)" : "var(--dark-line-strong)",
            }}
          />
          {sinkConfigured ? "sink · connected" : "sink · not set"}
          {recorded ? " · replay" : ""}
        </span>
      </header>

      <p
        className="mono"
        style={{
          margin: "8px 0 0",
          fontSize: 9,
          letterSpacing: ".02em",
          lineHeight: 1.4,
          color: "var(--dark-muted)",
        }}
      >
        sponsor · {ZOOWORK_SPONSOR.name} — {ZOOWORK_SPONSOR.role}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 6,
          marginTop: 7,
        }}
      >
        <ModelCell kind="LLM" model={models.llm} />
        <ModelCell kind="IMAGE" model={models.image} />
      </div>

      <ol style={{ margin: "2px 0 0", padding: 0, listStyle: "none" }}>
        {calls.map((call) => (
          <CallRow key={call.id} call={call} />
        ))}
      </ol>

      <footer
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
          borderTop: "1px solid var(--dark-line)",
          marginTop: 2,
          paddingTop: 7,
        }}
      >
        <span
          className="mono"
          style={{ fontSize: 9, letterSpacing: ".02em", color: "var(--dark-muted)", minWidth: 0 }}
        >
          {modelCalls} model call{modelCalls === 1 ? "" : "s"} · {formatMs(total)}
          {failed ? ` · ${failed} failed` : ""}
          {running ? " · in flight" : ""}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span
            className="mono"
            style={{ fontSize: 9, letterSpacing: ".02em", color: "var(--dark-muted)" }}
          >
            /trace is the record
          </span>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss the PRISM trace"
              className="mono"
              style={{
                border: "1px solid var(--dark-line)",
                background: "transparent",
                color: "var(--dark-muted)",
                fontSize: 9,
                lineHeight: 1,
                padding: "3px 5px",
                cursor: "pointer",
              }}
            >
              hide
            </button>
          ) : null}
        </span>
      </footer>
    </section>
  )
}
