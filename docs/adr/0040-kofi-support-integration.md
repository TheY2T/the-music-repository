# ADR 0040 — Ko-fi support integration

- **Status:** accepted
- **Date:** 2026-07

## Context

The site ships free, ad-free public-domain and openly-licensed music. The full premium system
(entitlements + Stripe/mock checkout, ADR 0015/0016) exists but is **deferred behind flags that default
off** (ADR 0035), so there was no way for supporters to contribute. Ko-fi offers a "tip jar" that needs
no PCI or Stripe onboarding — a good fit for voluntary support that is deliberately decoupled from any
paywall.

Ko-fi exposes two integration surfaces: a **frontend embed** (an inline iframe tip panel from `ko-fi.com`,
or a floating overlay from `storage.ko-fi.com/.../overlay-widget.js`) and an **inbound webhook** — an
`application/x-www-form-urlencoded` POST carrying a single `data` field with a JSON payload, authenticated
by a shared verification token inside the payload (not an HMAC over raw bytes). Ko-fi retries a delivery by
`message_id` until it receives a 200, and only fires at payment time (no "membership ended" events).

## Decision

1. **Scope is a support surface + webhook logging — not a paywall.** Ko-fi contributions are recorded for
   audit/analytics and grant **no** entitlements. This keeps Ko-fi independent of the dormant
   `monetization.premium` engine; the two never interact.
2. **Frontend uses the inline iframe + direct link, not the floating overlay.** A dedicated `/support`
   page mounts `SupportPanel` (`@TheY2T/tmr-common-ui`) with the Ko-fi iframe and a link; Support links
   appear in the header nav and footer. The overlay script is deliberately not adopted (no site-wide
   third-party script). The handle is configured via `PUBLIC_KOFI_USERNAME`.
3. **Gated by a new `support.kofi` flag, defaulting on.** The flag governs the **web UI only** (the page +
   nav/footer links). The inbound webhook is **not** flag-gated — like `POST /billing/webhook` it is an
   inbound provider endpoint kept out of the client TypeSpec contract, unauthenticated, verified by the
   shared token — because Ko-fi posts regardless of the site's UI flag.
4. **Hexagonal `support` feature on the API.** `RecordKofiDonationUseCase` parses the payload, verifies the
   token against `KOFI_VERIFICATION_TOKEN`, and records through a `DonationLedger` port
   (`DrizzleDonationLedger` → `kofi_donations`). Idempotency is the table itself: the primary key is Ko-fi's
   `message_id`, and re-recording is a no-op. A missing/wrong/unparseable payload raises
   `KofiWebhookVerificationError` (401 problem+json) so the endpoint never acts on anything it cannot both
   parse and verify.
5. **No CSP change needed today; documented for later.** The app ships no Content-Security-Policy, so the
   Ko-fi iframe loads unblocked. If a CSP is introduced, `ko-fi.com` must be allowlisted in `frame-src`
   (and `storage.ko-fi.com` in `script-src` if the overlay is ever adopted). The Ko-fi iframe sets
   third-party cookies, disclosed on the cookies page.

## Consequences

- Supporters can contribute immediately once `PUBLIC_KOFI_USERNAME` + `KOFI_VERIFICATION_TOKEN` are set,
  with no billing infrastructure and no coupling to premium.
- Every Ko-fi event is recorded exactly once for audit/analytics; there is no read/admin surface for the
  ledger yet — a future change can add one (and, if desired, wire donations to entitlements, which this
  deliberately does not do).
- The Ko-fi iframe renders in Ko-fi's styling, not the site theme, and introduces a third-party cookie on
  the `/support` page only — an accepted trade-off for a self-contained tip widget.
- Because the webhook is unauthenticated, its only defense is the shared token; an unset token safely
  rejects everything, and a wrong token returns 401 (Ko-fi will retry, which is harmless).
