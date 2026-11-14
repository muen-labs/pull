import { Suspense } from "react"

import { SignInScreen } from "@/components/auth/SignInScreen"

export const metadata = { title: "Pull — sign in" }

export default function SignInPage() {
  return (
    <Suspense>
      <SignInScreen />
    </Suspense>
  )
}
