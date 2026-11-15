/**
 * The screen a client sees before the board when the job has the email check on.
 *
 * Plain forms, no client JavaScript: the code has to work on a phone inside an email app's browser,
 * and a page that needs hydration to submit is a page that fails there. Two steps, one screen each.
 */
import { requestClientCode, verifyClientCode } from "@/server/actions/client-gate"
import styles from "./client-board.module.css"

const ERRORS: Record<string, string> = {
  wait: "A code was just sent. Give it a minute before asking for another.",
  code: "That code did not match. Check the six digits and try again.",
  expired: "That code has expired. Send yourself a new one.",
  noemail: "This link has no client email on the job — ask your stylist to add one.",
  mail: "Email is not connected on this deployment, so the code cannot be sent.",
  link: "This link is no longer valid.",
}

export function VerifyGate({
  token,
  maskedEmail,
  sent,
  err,
}: {
  token: string
  maskedEmail: string
  sent: boolean
  err?: string
}) {
  const error = err ? ERRORS[err] ?? "Something went wrong. Try again." : null

  return (
    <div className={styles.page}>
      <div className="container" style={{ maxWidth: 560, paddingTop: 80 }}>
        <p className="eyebrow">Private link</p>
        <h1 className="display" style={{ fontSize: "clamp(28px, 4vw, 38px)", margin: "10px 0 0" }}>
          Confirm it&rsquo;s you
        </h1>
        <p className="small" style={{ marginTop: 12 }}>
          These looks are private to your studio, so this link opens only for the person it was sent to.
          {sent ? (
            <> We sent a six-digit code to <strong>{maskedEmail}</strong>.</>
          ) : (
            <> We can send a six-digit code to <strong>{maskedEmail}</strong>.</>
          )}
        </p>

        {error ? (
          <p className="small" role="alert" style={{ color: "#b3261e", marginTop: 14 }}>
            {error}
          </p>
        ) : null}

        {!sent ? (
          <form action={requestClientCode} style={{ marginTop: 24 }}>
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="btn btn-primary">
              Send me a code
            </button>
          </form>
        ) : (
          <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
            <form action={verifyClientCode} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="hidden" name="token" value={token} />
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="000000"
                aria-label="Six-digit code"
                className="mono"
                style={{
                  width: 160,
                  fontSize: 22,
                  letterSpacing: 8,
                  textAlign: "center",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--surface)",
                }}
              />
              <button type="submit" className="btn btn-primary">
                Open my looks
              </button>
            </form>
            <form action={requestClientCode}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn btn-ghost btn-sm">
                Send a new code
              </button>
            </form>
          </div>
        )}

        <p className="small" style={{ marginTop: 28, color: "var(--muted-foreground-soft)" }}>
          You will not need this again on this device.
        </p>
      </div>
    </div>
  )
}
