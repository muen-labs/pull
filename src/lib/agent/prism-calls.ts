/**
 * The shape the PRISM widget draws: one model call, as a trace.
 *
 * PRISM (Block Convey) is the observability sink for model calls — not a provider. It stores
 * exchanges (prompt, output, model, latency) and groups them into runs, so the widget shows the
 * calls PRISM actually receives, with the model that produced each one. The app's own `events`
 * trace stays the record (`/trace`); PRISM is the mirror.
 *
 * ZooWork is the sponsor: it provides both model slots the app uses, on one key and one bill —
 * a vision/chat model that reads references and writes prompts, and an image model that renders.
 * The aliases are declared once here so every surface names them the same way.
 *
 * Pure: no `env` import, no server code, safe in a client bundle.
 */

export type PrismCallKind = "llm" | "image" | "tool"

export type PrismCallStatus = "ok" | "error" | "running"

export interface PrismCall {
  id: string
  /** Tool as it appears in the trace, e.g. "zoowork.vision". */
  tool: string
  kind: PrismCallKind
  status: PrismCallStatus
  /** The exact model alias, e.g. "litellm/gemini-3.8-flash". Absent on a pure tool call. */
  model?: string
  durationMs?: number
  /** One line of what the call read or produced — the thing a viewer cares about. */
  note?: string
  error?: string
}

/** The two model slots, as the deployment configures them. */
export interface PrismModels {
  llm?: string
  image?: string
}

/** The sponsor, named as it should read on screen. */
export const ZOOWORK_SPONSOR = {
  name: "ZooWork",
  role: "Managed Agents · LLM + image models",
} as const

export const ZOOWORK_LLM = {
  alias: "litellm/gemini-3.8-flash",
  label: "Gemini 3.8 Flash",
} as const

export const ZOOWORK_IMAGE = {
  alias: "gpt-image-2",
  label: "GPT Image 2",
} as const

/** Known aliases → the name a person would say. Unknown aliases pass through untouched. */
const LABELS: Record<string, string> = {
  [ZOOWORK_LLM.alias]: ZOOWORK_LLM.label,
  "gemini-3.8-flash": ZOOWORK_LLM.label,
  [ZOOWORK_IMAGE.alias]: ZOOWORK_IMAGE.label,
  "litellm/gpt-image-2": ZOOWORK_IMAGE.label,
}

/** "litellm/gemini-3.8-flash" → "Gemini 3.8 Flash". Unknown models keep their exact name. */
export function modelLabel(alias?: string): string {
  if (!alias) return "—"
  return LABELS[alias] ?? alias
}

/** The wire name, without ZooWork's provider prefix (`litellm/`), for the second line. */
export function modelAliasShort(alias?: string): string {
  if (!alias) return "not used on this run"
  return alias.replace(/^litellm\//, "")
}

export function prismTotalMs(calls: PrismCall[]): number {
  return calls.reduce((sum, call) => sum + (call.durationMs ?? 0), 0)
}

export function prismFailed(calls: PrismCall[]): number {
  return calls.filter((call) => call.status === "error").length
}

export function prismRunning(calls: PrismCall[]): boolean {
  return calls.some((call) => call.status === "running")
}

/**
 * Which models a run actually touched, in the order LLM then image. Used where the caller has
 * calls but no config (a recorded trace), so the rail still names the right models.
 */
export function modelsFromCalls(calls: PrismCall[]): PrismModels {
  return {
    llm: calls.find((call) => call.kind === "llm" && call.model)?.model,
    image: calls.find((call) => call.kind === "image" && call.model)?.model,
  }
}
