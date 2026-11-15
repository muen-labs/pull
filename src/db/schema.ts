/**
 * Pull demo schema — mirrors PRD §8 (prd/prd-pull-demo-3acts.md).
 * Neon Postgres + Drizzle. One stylist, many jobs, boards → looks, requests → emails → shipments.
 */
import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const jobStatus = pgEnum("job_status", [
  "draft",
  "published",
  "client_reviewed",
  "requests_drafted",
  "requests_sent",
  "complete",
])

export const lookStatus = pgEnum("look_status", ["draft", "approved", "passed"])
export const lookReadSource = pgEnum("look_read_source", ["image", "filename", "sequence", "manual"])

export const requestStatus = pgEnum("request_status", [
  "draft",
  "sent",
  "awaiting_label",
  "label_sent",
  "in_transit",
  "delivered",
  "failed",
])

export const shippingMode = pgEnum("shipping_mode", ["showroom_ships", "needs_label", "unknown"])
export const emailStatus = pgEnum("email_status", [
  "draft",
  "queued",
  "sent",
  "delivered",
  "bounced",
  "complained",
])

/**
 * A stylist. Identity is Clerk's; this row is the stable uuid our tables join on, created lazily the
 * first time someone signs in (`ensureUser` in src/lib/tenancy.ts). `clerk_user_id` is unique and
 * nullable because a row can predate the Clerk account it belongs to.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  /** Clerk's `user_…` id. The link between the identity provider and our row. */
  clerkUserId: text("clerk_user_id").unique(),
  name: text("name"),
  studioAddress: jsonb("studio_address").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * The tenant. One row per studio; every job hangs off one.
 *
 * `clerk_org_id` is the Clerk Organization this workspace mirrors — Clerk owns membership and
 * invitations, this table owns the uuid the database joins on and the billing state Stripe will
 * write. Nullable so a personal workspace exists before it is attached to an organization.
 */
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** The Clerk Organization this workspace mirrors. Null until a personal workspace joins one. */
    clerkOrgId: text("clerk_org_id"),
    /**
     * Which Muen product this workspace belongs to — `pull`, `mitsumeru`, `brand-os`, `nerv`,
     * `voice-koara`.
     *
     * One Clerk application serves the whole portfolio, so an organization is a *customer* in every
     * product at once. Without this column the same studio would be one tenant across all of them,
     * and separating their data would rest on remembering to filter, not on the schema. The unique
     * index below is on (org, product): one workspace per product per customer, never a shared one.
     */
    product: text("product").notNull().default("pull"),
    /** The billing plan: `solo` | `studio` | `house` (PRODUCT.md pricing). */
    plan: text("plan").notNull().default("solo"),
    /** Seats = active memberships. Stripe's subscription quantity mirrors this. */
    seatCount: integer("seat_count").notNull().default(1),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("workspaces_org_product_idx").on(t.clerkOrgId, t.product)],
)

/**
 * Who belongs to which workspace, and in what role.
 *
 * A mirror of Clerk's organization membership, not a source of truth: it exists so the database can
 * answer "which workspace is this user working in" without a Clerk round trip on every query, and so
 * a seat count can be read in SQL. One row per (workspace, user).
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    userId: uuid("user_id").notNull(),
    /** `owner` | `stylist`. Clerk's `org:admin` maps to owner. */
    role: text("role").notNull().default("stylist"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_workspace_user_idx").on(t.workspaceId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
)

export const boards = pgTable(
  "boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").notNull(),
    brand: text("brand").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("boards_job_idx").on(t.jobId)],
)

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The studio that owns this job. Every read of a job is scoped by this column. */
    workspaceId: uuid("workspace_id").notNull(),
    clientName: text("client_name").notNull(),
    /** The client's contact address — shown on the dashboard card, used when the board is sent. */
    clientEmail: text("client_email"),
    title: text("title").notNull(),
    shootDate: date("shoot_date").notNull(),
    callInDate: date("call_in_date").notNull(),
    returnDate: date("return_date").notNull(),
    status: jobStatus("status").notNull().default("draft"),
    publicTokenHash: text("public_token_hash"),
    /**
     * The raw client token is kept alongside its hash so re-publishing after edits returns the SAME
     * url (FR-7 acceptance). A hash alone cannot reproduce the token. It is still an HMAC-signed
     * opaque string — no job data, no PII — and rotating LINK_SECRET invalidates it.
     */
    publicToken: text("public_token"),
    /**
     * FR-11: submitting a review "timestamps it once" and locks further client edits. The PRD's
     * report (FR-12) quotes the submission time, so it needs a column; `status = client_reviewed`
     * alone cannot say when.
     */
    reviewSubmittedAt: timestamp("review_submitted_at", { withTimezone: true }),
    /**
     * When the stylist last acknowledged that review — the bell's unread rule is
     * `reviewSeenAt IS NULL OR reviewSeenAt < reviewSubmittedAt`. Kept on the job
     * instead of a notifications table: one source of truth, and re-publishing a
     * board moves `reviewSubmittedAt` and notifies again.
     */
    reviewSeenAt: timestamp("review_seen_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("jobs_workspace_idx").on(t.workspaceId)],
)

export const looks = pgTable(
  "looks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").notNull(),
    boardId: uuid("board_id").notNull(),
    /** Cloudinary original (the screenshot). */
    sourcePublicId: text("source_public_id"),
    /** Cloudinary delivery id used on the board (original + crop transform). */
    imagePublicId: text("image_public_id"),
    lookNo: integer("look_no").notNull(),
    season: text("season"),
    brand: text("brand").notNull().default("Unassigned"),
    confidence: numeric("confidence", { precision: 5, scale: 2 }),
    readSource: lookReadSource("read_source").notNull().default("filename"),
    ocrText: text("ocr_text"),
    status: lookStatus("status").notNull().default("draft"),
    priority: smallint("priority"),
    clientNote: text("client_note"),
    position: integer("position").notNull().default(0),
    /**
     * FR-6: deleting a look hides it from the client board but keeps it recoverable until publish.
     * The PRD's domain model has no column for this because "deleted" was assumed to mean deleted;
     * a soft-delete is what the acceptance criterion actually requires. Null = visible.
     */
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("looks_job_idx").on(t.jobId), index("looks_board_idx").on(t.boardId)],
)

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The studio's address book. Scoped by workspace, so two studios can both know the same house. */
    workspaceId: uuid("workspace_id").notNull(),
    brand: text("brand").notNull(),
    prMarket: text("pr_market"),
    // Written in the form Postgres stores it (`'{}'::text[]`), not `ARRAY[]::text[]`.
    // Known noise: drizzle-kit 0.31 re-emits `ALTER … SET DEFAULT` for this array column on every
    // `db:push`, because its comparison of an array default against the catalogue never matches.
    // Tested and it does not go away by spelling it differently, nor by `.default([])`. The statement
    // is idempotent, so this is cosmetic — but "changes applied" is not proof that anything changed.
    // Move to db:generate + db:migrate when the schema stabilises.
    emails: text("emails").array().notNull().default(sql`'{}'::text[]`),
    showroomAddress: jsonb("showroom_address").$type<Record<string, string>>(),
    shipsOnOwnAccount: boolean("ships_on_own_account").notNull().default(false),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("contacts_brand_market_idx").on(t.workspaceId, t.brand, t.prMarket)],
)

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").notNull(),
    contactId: uuid("contact_id"),
    brand: text("brand").notNull(),
    status: requestStatus("status").notNull().default("draft"),
    shippingMode: shippingMode("shipping_mode").notNull().default("unknown"),
    intakeTokenHash: text("intake_token_hash"),
    /** Raw intake token, kept so the draft email can show the link again. Same reasoning as jobs.publicToken. */
    intakeToken: text("intake_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("requests_job_idx").on(t.jobId)],
)

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id").notNull(),
    requestId: uuid("request_id"),
    resendId: text("resend_id"),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: emailStatus("status").notNull().default("draft"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    inReplyTo: text("in_reply_to"),
    attachments: jsonb("attachments").$type<{ filename: string; publicId?: string }[]>(),
    /** Drafts have no sent_at; a thread needs an ordering key for "original then label reply". */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("emails_job_idx").on(t.jobId), index("emails_request_idx").on(t.requestId)],
)

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull(),
    shippoShipmentId: text("shippo_shipment_id"),
    intake: jsonb("intake").$type<{
      length: number
      width: number
      height: number
      weightKg: number
      pickup: Record<string, string>
    }>(),
    rates: jsonb("rates").$type<
      { id: string; carrier: string; service: string; amount: number; currency: string; days: number }[]
    >(),
    chosenRateId: text("chosen_rate_id"),
    carrier: text("carrier"),
    service: text("service"),
    amountCents: integer("amount_cents"),
    currency: text("currency").default("USD"),
    etaDays: integer("eta_days"),
    labelUrl: text("label_url"),
    labelPublicId: text("label_public_id"),
    trackingNumber: text("tracking_number"),
    trackingStatus: text("tracking_status"),
    trackingUpdatedAt: timestamp("tracking_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("shipments_request_idx").on(t.requestId)],
)

/** The agent's audit trail, shown as "activity" on the job page. */
export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    jobId: uuid("job_id"),
    actor: text("actor").notNull().default("agent"),
    kind: text("kind").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_job_idx").on(t.jobId)],
)

/**
 * The agent wallet — one per WORKSPACE, shared by every seat in it.
 *
 * A studio buys seats, not balances: three stylists drawing from three wallets would mean deciding
 * who pays for a render before making it. One balance per workspace keeps the purchase decision where
 * it belongs (the studio) and keeps Stripe simple later — one customer, one subscription, one balance.
 *
 * `balance` is in generations, not money. It is an integer because a half render cannot be spent, and
 * every change goes through `wallet_entries` so a spend can always be traced back to its run.
 */
export const wallets = pgTable("wallets", {
  workspaceId: uuid("workspace_id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  /**
   * Prepaid money, in cents. Generations reset monthly; this does not — it is topped up and spent.
   *
   * Labels are charged ON THE SPOT, so a studio has to have the money before the carrier is paid.
   * Keeping it separate from `balance` is not cosmetic: generations are an allowance, cents are cash,
   * and a single number could not safely hold both.
   */
  moneyCents: integer("money_cents").notNull().default(0),
  /** What a monthly reset puts back — copied from the plan, not derived at read time. */
  monthlyGrant: integer("monthly_grant").notNull().default(0),
  /** Start of the current allowance period; a read past 30 days rolls it. */
  periodStart: timestamp("period_start", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * The ledger. One row per movement, carrying the run it paid for, so "where did this month's
 * generations go" is answerable — and so a failed render can be refunded against its own row.
 */
export const walletEntries = pgTable(
  "wallet_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    /** Negative for a spend, positive for a grant, a top-up or a refund. */
    delta: integer("delta").notNull(),
    /** `generation` | `cent` — one statement, two units, never a number without its unit. */
    unit: text("unit").notNull().default("generation"),
    /** The balance after this movement — a running statement the studio can read top to bottom. */
    balanceAfter: integer("balance_after").notNull(),
    /** `grant` | `render` | `research` | `refund` | `top_up`. */
    reason: text("reason").notNull(),
    /** The canvas run this paid for, when there was one. */
    runId: uuid("run_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wallet_entries_workspace_idx").on(t.workspaceId, t.createdAt)],
)

/**
 * What each label cost the studio, and what Pull added on top.
 *
 * Written at purchase, when the carrier's price is known for certain. `status` moves from
 * `unbilled` to `billed` when a month is invoiced, so a studio can see the same rows the invoice
 * was built from — and Muen can answer "what did this studio ship in March" from one table.
 */
export const labelCharges = pgTable(
  "label_charges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    jobId: uuid("job_id"),
    requestId: uuid("request_id"),
    /** The carrier's own price, in cents — pass-through, never revenue. */
    carrierCents: integer("carrier_cents").notNull(),
    /** Pull's handling, in cents. */
    surchargeCents: integer("surcharge_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    /** The rate in force at purchase (0.15), so an old row still explains its own numbers. */
    surchargeRate: numeric("surcharge_rate", { precision: 4, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    /** `unbilled` | `billed`. */
    status: text("status").notNull().default("unbilled"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("label_charges_workspace_idx").on(t.workspaceId, t.createdAt)],
)
