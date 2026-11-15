import Link from "next/link"
import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { requireStylist } from "@/lib/auth"
import { readSecretState } from "@/lib/secrets"
import { shippoMode } from "@/lib/shippo"
import { disconnectShipping, saveShippingKey, saveStudioForm } from "@/server/actions/studio"

export const metadata = { title: "Pull — studio settings" }

const FIELDS: { key: string; label: string; placeholder?: string; required?: boolean; wide?: boolean }[] = [
  { key: "name", label: "Studio name", placeholder: "Pull Studio" },
  { key: "street1", label: "Street", placeholder: "155 Wooster St", required: true },
  { key: "street2", label: "Floor / suite", placeholder: "Floor 3" },
  { key: "city", label: "City", placeholder: "New York", required: true },
  { key: "state", label: "State / region", placeholder: "NY" },
  { key: "zip", label: "ZIP / postcode", placeholder: "10012", required: true },
  { key: "country", label: "Country (2-letter)", placeholder: "US", required: true },
  { key: "phone", label: "Phone (carriers require one for labels)", placeholder: "+1 212 555 0147" },
  { key: "email", label: "Pickup email", placeholder: "studio@example.com" },
]

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const stylist = await requireStylist()
  const query = await searchParams
  const [row] = await db().select().from(users).where(eq(users.id, stylist.id)).limit(1)
  const address = (row?.studioAddress ?? {}) as Record<string, string>
  const shipping = await readSecretState(stylist.workspaceId, "shippo").catch(() => ({
    connected: false,
    last4: null,
    updatedAt: null,
  }))
  const addressComplete = Boolean(address.street1 && address.city && address.zip && address.country)

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/studio" className="mono" style={{ color: "var(--muted-foreground)" }}>
        ← JOBS
      </Link>
      <header style={{ marginTop: 16 }}>
        <p className="eyebrow">Studio</p>
        <h1 className="display" style={{ margin: "10px 0 0", fontSize: "clamp(26px, 3.6vw, 38px)" }}>
          Where the looks come back to
        </h1>
        <p className="small" style={{ marginTop: 12, maxWidth: 560 }}>
          This address appears in every request email&apos;s SHOOT DETAILS block, and it is where the
          showroom ships to — it is the destination for every label we quote. Street, city, ZIP and
          country are required.
        </p>
      </header>

      {query.saved === "shipping" && (
        <p className="small" role="status" style={{ color: "var(--ok)", marginTop: 16 }}>
          Shipping is connected. Rates and labels now use your own Shippo account.
        </p>
      )}
      {query.saved === "shipping-off" && (
        <p className="small" role="status" style={{ color: "var(--ok)", marginTop: 16 }}>
          Disconnected. Rates fall back to Pull&apos;s own account, if one is configured.
        </p>
      )}
      {query.saved === "1" && (
        <p className="small" role="status" style={{ color: "var(--ok)", marginTop: 16 }}>
          Saved. New request emails and labels will use this address.
        </p>
      )}
      {query.error && (
        <p className="small" role="alert" style={{ color: "var(--danger)", marginTop: 16 }}>
          {query.error}
        </p>
      )}

      <form action={saveStudioForm} className="card stack" style={{ marginTop: 20, padding: 24, gap: 16 }}>
        <div className="field-grid">
          {FIELDS.map((field) => (
            <div key={field.key} className={`field${field.key === "street1" ? " full" : ""}`}>
              <label htmlFor={`addr-${field.key}`}>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <input
                id={`addr-${field.key}`}
                name={field.key}
                defaultValue={address[field.key] ?? ""}
                placeholder={field.placeholder}
                required={field.required}
              />
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <p className="small" style={{ margin: 0, color: "var(--muted-foreground-soft)" }}>
            Address now on file:{" "}
            {address.street1
              ? [address.name, address.street1, address.street2, address.city, address.state, address.zip, address.country]
                  .filter(Boolean)
                  .join(", ")
              : "(none — requests will say the address is not set)"}
          </p>
          <button type="submit" className="btn btn-primary">
            Save address
          </button>
        </div>
      </form>

      {/* Shipping: their account, their key. Stored encrypted, checked before it is saved. */}
      <section className="card stack" style={{ marginTop: 20, padding: 24, gap: 16 }}>
        <div>
          <p className="eyebrow">Shipping</p>
          <p className="small" style={{ margin: "6px 0 0", maxWidth: 560 }}>
            Connect your own Shippo account, so labels are billed to you and not to us. The key is
            stored encrypted, never shown again, and only saved once Shippo has accepted it.
          </p>
        </div>

        <p className="small" style={{ margin: 0 }}>
          <span className="mono" style={{ color: shipping.connected ? "var(--ok)" : "var(--muted-foreground)" }}>
            {shipping.connected
              ? `connected · key ending ${shipping.last4}`
              : shippoMode() !== "off"
                ? "not connected — using Pull's own account"
                : "not connected"}
          </span>
        </p>

        {!addressComplete ? (
          <p className="small" role="note" style={{ margin: 0, color: "var(--muted-foreground)" }}>
            Save a complete studio address first — without street, city, ZIP and country Shippo cannot
            quote a rate, so a key on its own will not make labels work.
          </p>
        ) : null}

        <form action={saveShippingKey} className="row" style={{ gap: 12, alignItems: "flex-end" }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="shippo-key">Shippo API key</label>
            <input
              id="shippo-key"
              name="shippoKey"
              type="password"
              autoComplete="off"
              placeholder={shipping.connected ? "Paste a new key to replace the current one" : "shippo_test_…"}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save and test
          </button>
        </form>

        {shipping.connected ? (
          <form action={disconnectShipping}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Disconnect
            </button>
          </form>
        ) : null}
      </section>
    </div>
  )
}
