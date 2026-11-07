/**
 * GET /api/health — is the deployment actually wired to Postgres?
 *
 * The setup page describes what to connect; this answers whether it is connected. One `select 1`
 * through the same Drizzle client the app uses, so a green answer means the production
 * `DATABASE_URL` is real and the schema's database is reachable.
 */
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/db/client"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ db: "missing", note: "DATABASE_URL is not set" }, { status: 503 })
  }
  try {
    await db().execute(sql`select 1`)
    return NextResponse.json({ db: "ok" })
  } catch (error) {
    return NextResponse.json(
      { db: "error", message: error instanceof Error ? error.message.slice(0, 200) : "unknown" },
      { status: 502 },
    )
  }
}
