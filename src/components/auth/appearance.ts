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
    colorTextSecondary: "#6b6b74",
    colorBackground: "var(--plate)",
    colorInputBackground: "var(--plate)",
    colorInputText: "#0a0a0a",
    colorBorder: "rgba(0, 0, 0, 0.08)",
    colorRing: "#0a0a0a", // ink — the kit's focus ring in this theme
    borderRadius: "20px",
    fontFamily: "var(--font-sans)",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: { width: "100%", boxShadow: "none" },
    // Clerk's own "Sign in to <app>" duplicates the headline we wrote on the left; one voice only.
    header: { display: "none" },
    // The Muen plate: the kit's card material and 20px corner. Object form because Clerk's own
    // stylesheet sets a shadow with higher specificity.
    card: {
      boxShadow: "var(--brandos-card-shadow)",
      border: "1px solid var(--border)",
      borderRadius: "20px",
      backgroundColor: "var(--plate)",
    },
    headerTitle: "text-[20px] font-medium tracking-[-0.02em] text-foreground",
    headerSubtitle: "text-[13px] text-muted-foreground",
    // 46px tall and square, matching `.btn` and `.btn-primary`.
    // The CTA is a pill, per the house. Object form: `borderRadius` above is a Clerk *variable*
    // (20px, the card's corner) and a className cannot outweigh it, so the radius is stated here.
    formButtonPrimary: {
      height: "46px",
      borderRadius: "999px",
      fontSize: "14px",
      fontWeight: 600,
      textTransform: "none",
      boxShadow: "none",
    },
    formFieldLabel: "text-[11px] tracking-[0.02em] text-muted-foreground",
    formFieldInput: "h-[42px] text-[14px] shadow-none",
    socialButtonsBlockButton: "h-[42px] border-border shadow-none",
    dividerLine: "bg-border",
    dividerText: "text-[11px] tracking-[0.02em] text-muted-foreground-soft",
    // A caption under the plate: without the gap it reads as clipped by the card's shadow.
    footer: { marginTop: "16px" },
    footerAction: "text-[13px]",
    footerActionLink: "text-brand font-medium hover:text-brand",
    identityPreviewText: "text-[13px]",
    formFieldErrorText: "text-[12px]",
    alertText: "text-[12px]",
  },
} as const
