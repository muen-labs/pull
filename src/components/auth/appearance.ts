/**
 * Clerk, dressed as PULL.
 *
 * Two rules from the design system decide almost all of this:
 *   · **No radius.** Every PULL button is square (globals.css §buttons), so `borderRadius: "0"` — and
 *     Clerk's inputs and primary button inherit it.
 *   · **Ink is the action, olive is emphasis.** The primary button is near-black, the focus ring and
 *     links take `--brand` (olive). The brand colour never becomes a fill.
 *
 * `@clerk/ui`'s prebuilt themes are deliberately NOT used: loading one makes the instance fetch
 * `ui.browser.js` from its frontend API, and the Muen dev instance 404s that file — the widget then
 * renders nothing at all. The variables and element styles below are the whole theme, which is also
 * less to break.
 */
/** Values mirror src/styles/pull-theme.css. Tokens are referenced where Clerk accepts CSS values. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0a0a0a", // ink: the action
    colorText: "#0a0a0a",
    colorTextSecondary: "#6b6a66",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0a0a0a",
    colorBorder: "#e6e3e3",
    colorRing: "#465907", // olive, the focus ring
    borderRadius: "0",
    fontFamily: "var(--font-sans)",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: { width: "100%", boxShadow: "none" },
    // Clerk's own "Sign in to <app>" duplicates the headline we wrote on the left; one voice only.
    header: { display: "none" },
    // A hairline sheet, not a floating card. An object rather than classes: the shadcn theme sets
    // `box-shadow` and a translucent border with higher specificity, so `shadow-none` lost.
    card: {
      boxShadow: "none",
      border: "1px solid var(--border)",
      borderRadius: "0",
      backgroundColor: "var(--card)",
    },
    headerTitle: "text-[20px] font-medium tracking-[-0.02em] text-foreground",
    headerSubtitle: "text-[13px] text-muted-foreground",
    // 46px tall and square, matching `.btn` and `.btn-primary`.
    formButtonPrimary:
      "h-[46px] text-[14px] font-medium normal-case tracking-normal shadow-none hover:bg-[#1f1f1e]",
    formFieldLabel: "text-[11px] tracking-[0.02em] text-muted-foreground",
    formFieldInput: "h-[42px] text-[14px] shadow-none",
    socialButtonsBlockButton: "h-[42px] border-border shadow-none",
    dividerLine: "bg-border",
    dividerText: "text-[11px] tracking-[0.02em] text-muted-foreground-soft",
    footerAction: "text-[13px]",
    footerActionLink: "text-brand font-medium hover:text-brand",
    identityPreviewText: "text-[13px]",
    formFieldErrorText: "text-[12px]",
    alertText: "text-[12px]",
  },
} as const
