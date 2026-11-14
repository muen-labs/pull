/**
 * Proxy — the request gate that runs before every route.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`; this file replaces `src/middleware.ts`
 * so Clerk's middleware and the public-link rate limiter share one pass instead of competing for the
 * same file. Two rules, in order:
 *
 *   1. **The public links are rate-limited, never gated.** `/b/{token}` (client board) and
 *      `/i/{token}` (showroom intake) are the only surfaces an anonymous caller can reach, so they
 *      keep the 30/min limiter from PRD §13. A 429 must never look like an invalid link.
 *   2. **The studio is behind Clerk.** `/studio` and `/api/studio` call `auth.protect()`. Everything
 *      else — the landing page, `/client`, `/requests`, `/board`, `/design`, `/trace` — stays open,
 *      because those are the demo and the client's side of the product.
 *
 * The matcher is deliberately broad: it skips Next's own assets and static files, then runs on every
 * page and API route. Narrowing it to `/studio` would silently drop the rate limiter on `/b` and `/i`.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse, type NextRequest } from "next/server"
import { take } from "@/lib/rate-limit"

const WINDOW_MS = 60_000
// 30/min is the PRD target; dev is looser so a test loop cannot trip the limit and burn ten minutes
// chasing a phantom bug. RATE_LIMIT_MAX overrides both.
const LIMIT = Number(process.env.RATE_LIMIT_MAX ?? (process.env.NODE_ENV === "production" ? 30 : 600))

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip")?.trim() || "local"
}

/** Routes that require a signed-in stylist. The client's surfaces are never in this list. */
const isStudioRoute = createRouteMatcher(["/studio(.*)", "/api/studio(.*)"])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const scope = pathname.startsWith("/b/") ? "client" : pathname.startsWith("/i/") ? "intake" : null

  if (scope) {
    const result = take(`${scope}:${clientIp(request)}`, LIMIT, WINDOW_MS)
    if (!result.ok) {
      return new NextResponse("Too many requests — slow down and try again shortly.\n", {
        status: 429,
        headers: {
          "retry-after": String(result.retryAfterSeconds),
          "cache-control": "no-store",
        },
      })
    }
  }

  if (isStudioRoute(request) && !(await signedIn())) {
    // Explicit, not `auth.protect()`. protect() decides for itself whether the request is a document
    // request; on Vercel's edge it classified these as non-document and answered 404 instead of
    // redirecting — the studio disappeared in production while working locally. A redirect we build
    // ourselves behaves the same everywhere, and keeps the return path.
    if (pathname.startsWith("/api/")) {
      // JSON for API routes: a redirect would reach `fetch` as HTML and read as a parse error.
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    const signIn = new URL("/sign-in", request.url)
    signIn.searchParams.set("redirect_url", request.url)
    return NextResponse.redirect(signIn)
  }

  /** True when the session has a user. `auth()` is the proxy's session reader. */
  async function signedIn(): Promise<boolean> {
    const { userId } = await auth()
    return Boolean(userId)
  }
})

export const config = {
  matcher: [
    // Everything except Next's build assets and files with an extension.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API routes always run through the proxy, extension or not.
    "/(api|trpc)(.*)",
  ],
}
