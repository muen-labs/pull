"use client"

/**
 * `/sign-in` — stylists only. The client's link never comes through here.
 *
 * The form is Clerk's; the frame and the words are PULL's (src/components/auth/AuthShell.tsx). Landing
 * after a successful sign-in is `/studio`, because that is the only thing behind this door.
 */
import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/AuthShell"
import { clerkAppearance } from "@/components/auth/appearance"

export function SignInScreen() {
  return (
    <AuthShell
      eyebrow="Studio access"
      title="Sign in to your studio."
      emphasis="studio"
      body="Your boards, your clients' approvals and the showroom requests live here. One workspace per studio, one seat per stylist."
    >
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/studio"
        appearance={clerkAppearance}
      />
    </AuthShell>
  )
}
