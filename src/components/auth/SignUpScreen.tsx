"use client"

/**
 * `/sign-up` — the same frame as sign-in, with the studio's first-run promise.
 *
 * Organizations are optional, so a new account starts in a personal workspace and can create or join
 * a studio from the switcher afterwards. The copy says that, because otherwise "where is my team?"
 * is the first thing a stylist asks.
 */
import { SignUp } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/AuthShell"
import { clerkAppearance } from "@/components/auth/appearance"

export function SignUpScreen() {
  return (
    <AuthShell
      eyebrow="New studio"
      title="Start your studio."
      emphasis="studio"
      body="You land in your own workspace first. Create a studio — or join the one you were invited to — from the switcher once you are in."
    >
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/studio"
        appearance={clerkAppearance}
      />
    </AuthShell>
  )
}
