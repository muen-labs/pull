/**
 * Studio settings. Only one row exists (the demo's single stylist), so this is deliberately a
 * single-form action rather than a CRUD surface.
 *
 * The studio address is not decoration: it is the ship-to in every request email's SHOOT DETAILS
 * block and the destination every Shippo rate is quoted for. An incomplete address previously only
 * surfaced when the intake page refused to quote — better to validate it where it is entered.
 */
"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { requireStylist } from "@/lib/auth"
import { removeSecret, saveSecret } from "@/lib/secrets"

const REQUIRED = ["street1", "city", "zip", "country"] as const

export interface StudioResult {
  ok: boolean
  error?: string
}

export async function saveStudioForm(form: FormData): Promise<void> {
  const stylist = await requireStylist()

  const address: Record<string, string> = {}
  for (const key of ["name", "street1", "street2", "city", "state", "zip", "country", "phone", "email"]) {
    const value = String(form.get(key) ?? "").trim()
    if (value) address[key] = value
  }

  const missing = REQUIRED.filter((key) => !address[key])
  if (missing.length) {
    redirect(`/studio/settings?error=${encodeURIComponent(`Missing: ${missing.join(", ")}`)}`)
  }
  if (address.country && !/^[A-Za-z]{2}$/.test(address.country)) {
    redirect(`/studio/settings?error=${encodeURIComponent("Country must be a 2-letter code, e.g. US or FR.")}`)
  }

  await db().update(users).set({ studioAddress: address }).where(eq(users.id, stylist.id))
  revalidatePath("/studio/settings")
  revalidatePath("/studio/jobs/[id]", "page")
  redirect("/studio/settings?saved=1")
}

/**
 * Connect the studio's OWN shipping account.
 *
 * The key is proven before it is stored: a round trip to Shippo with that exact key. Saving an
 * unverified string is how "connected" stops meaning anything — the page would claim shipping works
 * while every rate request fails. The address matters too, but it is checked where rates are quoted;
 * this action only answers "is this key alive".
 */
export async function saveShippingKey(formData: FormData) {
  const stylist = await requireStylist()
  const key = String(formData.get("shippoKey") ?? "").trim()

  if (!key) {
    redirect(`/studio/settings?error=${encodeURIComponent("Paste the key from your Shippo dashboard.")}`)
  }
  if (!/^shippo_(test|live)_/.test(key)) {
    redirect(
      `/studio/settings?error=${encodeURIComponent("A Shippo key starts with shippo_test_ or shippo_live_.")}`,
    )
  }

  const check = await verifyShippoKey(key)
  if (!check.ok) {
    redirect(`/studio/settings?error=${encodeURIComponent(`Shippo rejected the key — ${check.reason}`)}`)
  }

  await saveSecret(stylist.workspaceId, "shippo", key)
  revalidatePath("/studio/settings")
  revalidatePath("/requests")
  redirect("/studio/settings?saved=shipping")
}

/** Disconnect: rates fall back to the platform key, or stop if there is none. */
export async function disconnectShipping() {
  const stylist = await requireStylist()
  await removeSecret(stylist.workspaceId, "shippo")
  revalidatePath("/studio/settings")
  redirect("/studio/settings?saved=shipping-off")
}

/** One call the studio's key has to survive before the page calls it connected. */
async function verifyShippoKey(key: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const res = await fetch("https://api.goshippo.com/carrier_accounts", {
      headers: { authorization: `ShippoToken ${key}` },
      cache: "no-store",
    })
    if (res.ok) return { ok: true }
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "the key is not valid (401)." }
    return { ok: false, reason: `Shippo answered ${res.status}.` }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "the request failed" }
  }
}
