import { ClerkProvider } from "@clerk/nextjs"
import { Manrope } from "next/font/google"
import type { Metadata } from "next"

import { DemoGuide } from "@/components/DemoGuide"

import "./globals.css"

/**
 * One face. Manrope, self-hosted through next/font — the same face the Muencollective site uses, and
 * the theme's only typeface (the EVA muen theme points --font-sans at this variable).
 */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pull — from selects to confirmed looks",
  description:
    "Drop a folder of look screenshots. Pull crops them, reads the look numbers, builds the boards, sends your client one link — and turns their approvals into request emails and prepaid labels.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-eva-theme="muen" className={manrope.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ClerkProvider>
          <DemoGuide />
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
