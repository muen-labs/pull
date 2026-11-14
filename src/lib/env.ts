/** Typed environment access. Nothing crashes at build time when a key is missing. */
import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z.string().url().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),

  SHIPPO_API_KEY: z.string().optional(),
  SHIPPO_WEBHOOK_SECRET: z.string().optional(),

  // Identity is Clerk's; LINK_SECRET is still ours, because the client link must never need a login.
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  LINK_SECRET: z.string().optional(),

  // Billing — Phase 2. Prices live in env so test and live ids cannot be mixed.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_SEAT_MONTHLY: z.string().optional(),
  STRIPE_PRICE_SEAT_ANNUAL: z.string().optional(),
  // The demo's mail-capture list: addresses that get real mail while RESEND_REDIRECT_TO parks
  // everything else on one inbox. It gated sign-in before Clerk; the name stayed so old env files
  // keep working. Validated by allowedEmails(), not .email(), because a list would fail that check.
  AUTH_ALLOWED_EMAIL: z.string().optional(),
  PUBLIC_BASE_URL: z.string().url().optional(),

  OPENAI_API_KEY: z.string().optional(),

  // Agent inference — DeepSeek for the pre-credit demo, ZooWork Managed Agents when funded.
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_MODEL: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().optional(),
  AGENT_PROVIDER: z.enum(["deterministic", "deepseek", "zoowork"]).optional(),
  ZOOWORK_API_KEY: z.string().optional(),
  ZOOWORK_MODEL: z.string().optional(),
  ZOOWORK_BASE_URL: z.string().url().optional(),
  ZOOWORK_ENABLED: z.enum(["true", "false"]).optional(),

  // Block Convey PRISM — observability for model calls. Off unless all three are set.
  PRISMTRACE_HOST: z.string().url().optional(),
  PRISMTRACE_PROJECT_ID: z.string().optional(),
  PRISMTRACE_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof schema>

let cached: Env | null = null

/**
 * Only the keys we declare, and empty strings become undefined.
 * (An empty `DATABASE_URL=` in .env.local must not fail `.url()` validation and wipe every other key.)
 */
function relevantEnv(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(schema.shape) as (keyof typeof schema.shape)[]) {
    const value = process.env[String(key)]
    if (value && value.trim()) out[String(key)] = value.trim()
  }
  return out
}

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(relevantEnv())
    cached = parsed.success ? parsed.data : ({} as Env)
  }
  return cached
}

/**
 * Who receives real mail while the demo captures everything else. AUTH_ALLOWED_EMAIL takes one
 * address or a list
 * (`stylist@studio.com, test@second-device.com`), so the same demo can be opened on more than one
 * inbox without editing code. Comparison is case-insensitive and whitespace-tolerant.
 */
export function allowedEmails(): string[] {
  return (env().AUTH_ALLOWED_EMAIL ?? "")
    .split(/[,\s]+/)
    .map((address) => address.trim().toLowerCase())
    .filter((address) => address.includes("@"))
}

export function isAllowedEmail(email: string): boolean {
  const needle = email.trim().toLowerCase()
  return Boolean(needle) && allowedEmails().includes(needle)
}

export type ServiceName =
  | "Neon"
  | "Clerk"
  | "Cloudinary"
  | "Resend"
  | "Shippo"
  | "Link signing"
  | "Stripe"
  | "Agent inference"

export interface ServiceStatus {
  name: ServiceName
  configured: boolean
  variables: string[]
  docs: string
}

/** Used by the setup screen and `npm run check`. */
export function serviceStatuses(): ServiceStatus[] {
  const e = env()
  return [
    {
      name: "Neon",
      configured: Boolean(e.DATABASE_URL),
      variables: ["DATABASE_URL"],
      docs: "https://console.neon.tech",
    },
    {
      name: "Cloudinary",
      configured: Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET),
      variables: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
      docs: "https://console.cloudinary.com/settings/api-keys",
    },
    {
      name: "Resend",
      configured: Boolean(e.RESEND_API_KEY),
      variables: ["RESEND_API_KEY", "RESEND_FROM"],
      docs: "https://resend.com/api-keys",
    },
    {
      name: "Shippo",
      configured: Boolean(e.SHIPPO_API_KEY),
      variables: ["SHIPPO_API_KEY"],
      docs: "https://app.goshippo.com/settings/api",
    },
    {
      name: "Clerk",
      // Both halves: the publishable key is what the browser needs, the secret is what the server does.
      configured: Boolean(e.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && e.CLERK_SECRET_KEY),
      variables: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
      docs: "https://dashboard.clerk.com/~/api-keys",
    },
    {
      name: "Link signing",
      // Client and showroom links are signed with LINK_SECRET and are never Clerk-gated.
      configured: Boolean(e.LINK_SECRET),
      variables: ["LINK_SECRET"],
      docs: "/setup",
    },
    {
      name: "Stripe",
      // Phase 2. A subscription with a per-seat quantity; the webhook secret is what keeps it honest.
      configured: Boolean(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET),
      variables: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      docs: "https://dashboard.stripe.com/apikeys",
    },
    {
      name: "Agent inference",
      configured: Boolean(e.DEEPSEEK_API_KEY || (e.ZOOWORK_API_KEY && e.ZOOWORK_ENABLED === "true")),
      variables: ["DEEPSEEK_API_KEY", "ZOOWORK_API_KEY", "ZOOWORK_ENABLED"],
      docs: "https://zoowork.ai/docs/get-started/quickstart.md",
    },
  ]
}
