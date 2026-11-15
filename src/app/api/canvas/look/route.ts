/**
 * POST /api/canvas/look — compose one look from four references.
 *
 * Body: `{ refs: [{ role?, name, dataUrl, markedDataUrl? }], prompt? }`. The vision pass
 * writes the prompt unless one is supplied (a re-run of an edited prompt). Returns
 * `{ ok: true, prompt, promptSource, image, ms, calls, models }`, or `{ ok: false, reason }` so the
 * canvas can fall back to its sample output instead of dead-ending a demo.
 *
 * `calls` is the ZooWork model-call trace (vision, then image) with real durations; `models` names
 * the two sponsor model slots the run used. The PRISM widget renders both, and the same records are
 * mirrored to PRISM inside composeLook.
 */
import { NextResponse } from "next/server"

import { getStylist } from "@/lib/auth"
import { canvasConfigured, composeLook, type LookRef } from "@/lib/canvas/zoowork-image"
import { ensureWallet, refundWallet, spendFromWallet, WALLET_COST } from "@/lib/wallet"

export const maxDuration = 300

function readRefs(value: unknown): LookRef[] {
  if (!Array.isArray(value)) throw new Error("refs must be an array")
  if (value.length === 0 || value.length > 4) throw new Error("1–4 references are allowed")
  return value.map((entry, index) => {
    const row = entry as { name?: unknown; dataUrl?: unknown; assistDataUrl?: unknown; marked?: unknown }
    const name = typeof row.name === "string" && row.name.trim() ? row.name.trim() : `reference ${index + 1}`
    const dataUrl = typeof row.dataUrl === "string" ? row.dataUrl : ""
    if (!dataUrl.startsWith("data:image/")) throw new Error(`reference ${index + 1} is not an image`)
    if (dataUrl.length > 8_000_000) throw new Error(`reference ${index + 1} is too large`)
    const assistDataUrl =
      typeof row.assistDataUrl === "string" && row.assistDataUrl.startsWith("data:image/")
        ? row.assistDataUrl
        : undefined
    if (assistDataUrl && assistDataUrl.length > 8_000_000) {
      throw new Error(`reference ${index + 1} reading copy is too large`)
    }
    return { name, dataUrl, assistDataUrl, marked: row.marked === true }
  })
}

export async function POST(request: Request) {
  if (!canvasConfigured()) {
    return NextResponse.json({ ok: false, reason: "ZooWork is not configured on this deployment" })
  }

  /**
   * The wallet gate, before anything is spent.
   *
   * A signed-in studio pays from its workspace wallet (one balance, shared by every seat). A caller
   * with no session is the public demo and is not charged — it also cannot be, since there is no
   * workspace to bill. When the wallet is empty the run never reaches the provider, so an exhausted
   * studio cannot accumulate a bill it did not ask for; the canvas turns `wallet_empty` into a
   * top-up message rather than a generic failure.
   */
  const stylist = await getStylist().catch(() => null)
  let charged: { workspaceId: string } | null = null
  if (stylist) {
    const wallet = await ensureWallet(stylist.workspaceId)
    const spend = await spendFromWallet(stylist.workspaceId, WALLET_COST.render, "render")
    if (!spend.ok) {
      return NextResponse.json(
        {
          ok: false,
          reason:
            spend.reason === "wallet_missing"
              ? "Wallet empty — this workspace has no wallet yet."
              : `Wallet empty — ${spend.balance} of ${wallet.grant} generations left this month.`,
          wallet: { balance: spend.balance, grant: wallet.grant },
          code: "wallet_empty",
        },
        { status: 402 },
      )
    }
    charged = { workspaceId: stylist.workspaceId }
  }

  let refs: LookRef[]
  let prompt: string | undefined
  try {
    const body = (await request.json()) as { refs?: unknown; prompt?: unknown }
    refs = readRefs(body.refs)
    prompt = typeof body.prompt === "string" ? body.prompt.slice(0, 1200) : undefined
  } catch (error) {
    return NextResponse.json(
      { ok: false, reason: error instanceof Error ? error.message : "invalid body" },
      { status: 400 },
    )
  }

  // Stream one NDJSON line per phase, then the result. The phase lines come from the
  // ZooWork session's own progress (tool/lifecycle events), so the card shows the real step.
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (value: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`))
        } catch {
          // The client walked away; the run keeps going and the artifact is still published.
        }
      }
      try {
        const result = await composeLook(refs, prompt, (phase) => send({ type: "phase", phase }))
        send({ type: "result", ok: true, ...result })
      } catch (error) {
        // A render that failed never became a look, so it never becomes a charge.
        if (charged) await refundWallet(charged.workspaceId, WALLET_COST.render, "refund").catch(() => {})
        send({ type: "result", ok: false, reason: error instanceof Error ? error.message : "compose failed" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  })
}
