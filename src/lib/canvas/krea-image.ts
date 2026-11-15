/**
 * The look compose, through Krea.
 *
 * Krea exposes gpt-image-2 directly — the same model the render currently reaches through ZooWork's
 * agent workspace — so this replaces a workflow of four reference uploads, a vision pass and a node
 * graph with one call: POST, poll, take the first URL.
 *
 * The fidelity that matters is why this exists: a cheap fast model (MiniMax H3 on RunningHub, 48s,
 * 7.5 points) invented a different person's face, which breaks the only promise the canvas makes.
 * gpt-image-2 keeps the client's own face, at the cost of ~80s either way.
 *
 * Images travel as data URIs — no upload endpoint, no asset ids, no key-in-multipart step (the
 * RunningHub CLI failed exactly there). The contract matches `composeLook` so the canvas, the wallet
 * and the trace do not need to know which provider answered.
 */
import { Krea } from "@krea-ai/sdk"

import type { LookRef } from "./zoowork-image"

const MODEL = "image/openai/gpt-image-2" as const

export function kreaConfigured(): boolean {
  return Boolean(process.env.KREA_API_KEY)
}

let client: InstanceType<typeof Krea> | null = null
function krea(): InstanceType<typeof Krea> {
  if (!client) client = new Krea({ apiKey: process.env.KREA_API_KEY as string })
  return client
}

export interface KreaLookResult {
  prompt: string
  promptSource: "assist" | "template" | "edited"
  image: string
  ms: number
  artifactId: string | null
  calls: { tool: string; note?: string; kind: string; ms: number; model: string }[]
  models: { llm: string; image: string }
  url: string
}

/**
 * Compose one look. `prompt` is required here: Krea is the render, not the writer, so the caller
 * (a stylist's edit, or the vision pass) supplies the words. Without one we build the same template
 * the ZooWork ladder falls back to, so an unmarked board still renders.
 */
export async function composeLookKrea(
  refs: LookRef[],
  prompt: string | undefined,
  onPhase?: (phase: string) => void,
): Promise<KreaLookResult> {
  const started = Date.now()
  const clean = refs.filter((ref) => ref.dataUrl?.startsWith("data:image/"))
  if (clean.length === 0) throw new Error("no usable references — add at least one image")

  const written = prompt?.trim() || templatePrompt(refs)
  onPhase?.("reading")
  onPhase?.("rendering")

  const result = await krea().subscribe(MODEL, {
    input: {
      prompt: written,
      image_urls: clean.map((ref) => ref.dataUrl),
      quality: "high",
    },
  })

  const url = (result as { data?: { urls?: string[] } })?.data?.urls?.[0]
  if (!url) throw new Error("Krea returned a completed job without an image URL")

  onPhase?.("saving")
  const res = await fetch(url)
  if (!res.ok) throw new Error(`could not download the render (${res.status})`)
  const bytes = Buffer.from(await res.arrayBuffer())
  const image = `data:${res.headers.get("content-type") || "image/png"};base64,${bytes.toString("base64")}`
  const ms = Date.now() - started

  return {
    prompt: written,
    promptSource: prompt?.trim() ? "edited" : "template",
    image,
    ms,
    artifactId: null,
    calls: [{ tool: "krea.render", kind: "image", model: "gpt-image-2", ms }],
    models: { llm: "deepseek", image: "gpt-image-2" },
    url,
  }
}

/** The same four-role template the ZooWork fallback uses, so both providers degrade identically. */
function templatePrompt(refs: LookRef[]): string {
  const roles = refs.map((ref, i) => `${i + 1}. ${ref.name}`).join("\n")
  return [
    "Compose one editorial lookbook photograph.",
    "Keep the subject's face, hair and build exactly as shown in the reference of the subject.",
    "Dress them in the garments from the other references.",
    "Full body, neutral studio light, plain background.",
    "References:",
    roles,
  ].join("\n")
}
