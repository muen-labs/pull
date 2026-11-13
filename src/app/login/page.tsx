import { redirect } from "next/navigation"

/**
 * `/login` was the magic-link door. Identity is Clerk's now, so this route only forwards.
 *
 * It stays as a redirect rather than being deleted because links to it exist in old emails, docs and
 * bookmarks — a 404 there reads as "the product broke". Deleting it properly (and the magic-token
 * action with it) is the last step of the Clerk cutover.
 */
export const metadata = { title: "Pull — sign in" }

export default function LoginPage() {
  redirect("/sign-in")
}
