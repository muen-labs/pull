import { Suspense } from "react"

import { SignUpScreen } from "@/components/auth/SignUpScreen"

export const metadata = { title: "Pull — start a studio" }

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpScreen />
    </Suspense>
  )
}
