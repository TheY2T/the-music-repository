# Feature: Ko-fi support

- **Phase:** P · **Status:** shipped
- **Flag key:** `support.kofi` (from `@TheY2T/tmr-flags`; web UI only, defaults **on**)

## Purpose

Give visitors a low-friction way to support the project. The Music Repository ships free, ad-free
public-domain and openly-licensed music; Ko-fi provides a "tip jar" with no PCI/Stripe onboarding.
Contributions are voluntary — they unlock nothing. This is separate from the (deferred) premium
entitlement system (`monetization.premium`); Ko-fi never grants entitlements.

## UX behaviour

- A **Support** link appears in the primary header nav and in the footer's legal/links column when
  `support.kofi` is on (both built in `packages/web-acl/src/nav.ts`: `buildPrimaryNav` + `buildLegalNav`).
- **`/support`** (`apps/web/src/pages/support.astro`) mounts the `SupportPanel` island
  (`@TheY2T/tmr-common-ui/SupportPanel`): a short thank-you, a "Support us on Ko-fi" link to the
  operator's Ko-fi page, and the embedded Ko-fi tip panel (an iframe from `ko-fi.com`).
- The Ko-fi handle comes from `PUBLIC_KOFI_USERNAME`. When unset, the panel shows a "check back soon"
  note instead of the link/iframe, so the page never renders a broken widget.
- The Ko-fi iframe keeps Ko-fi's own styling (a third-party widget, like embedded media) rather than the
  site theme.

## Data model

`kofi_donations` (`apps/api/src/infrastructure/database/schema.ts`) — one row per Ko-fi `message_id`
(the idempotency key). Columns: `kofi_transaction_id`, `type` (`Donation`/`Subscription`/`Commission`/
`Shop Order`), `from_name`, `email`, `amount`, `currency`, `message`, `is_public`,
`is_subscription_payment`, `tier_name`, `kofi_timestamp`, `raw` (jsonb of the full verified payload),
`received_at`. Audit/analytics only — no foreign keys, no entitlement effects.

## API contract

`POST /support/kofi/webhook` — an **inbound provider endpoint**, kept out of the client TypeSpec contract
(like `POST /billing/webhook`), unauthenticated, and NOT flag-gated (Ko-fi posts regardless of the site's
UI flag). Ko-fi delivers `application/x-www-form-urlencoded` with a single `data` field holding a JSON
string; the parser + normalizer live in `apps/api/src/support/application/kofi-payload.ts`.

Hexagonal feature `apps/api/src/support/`:

- **Port** `DonationLedger` (`record` / `wasRecorded`) ← adapter `DrizzleDonationLedger`.
- **Use-case** `RecordKofiDonationUseCase` — parse → verify the shared token against
  `KOFI_VERIFICATION_TOKEN` (mismatch/missing/unparseable → `KofiWebhookVerificationError`, 401
  problem+json) → idempotency check by `message_id` → record. Always returns 200 on a handled event so
  Ko-fi stops retrying.

Config: `KOFI_VERIFICATION_TOKEN` (api, from Ko-fi's Advanced webhook settings — unset ⇒ every webhook is
rejected); `PUBLIC_KOFI_USERNAME` (web, the public handle).

## Third-party embed / CSP

There is no Content-Security-Policy today, so the Ko-fi iframe (`ko-fi.com`) and — if the floating
overlay is ever adopted — the overlay script (`storage.ko-fi.com`) load unblocked. If a CSP is added
later, allowlist `ko-fi.com` in `frame-src` and `storage.ko-fi.com` in `script-src`. The Ko-fi iframe
sets third-party cookies; this is disclosed on the cookies page (`apps/web/src/pages/cookies.astro`).
See ADR 0040.

## Help topics

None.

## Tests

- **Unit** — `apps/api/src/support/application/record-kofi-donation.use-case.test.ts`: token match records;
  wrong/missing token and unparseable payload reject (`KofiWebhookVerificationError`) and record nothing;
  duplicate `message_id` is idempotent; subscription normalization.
- **Component** — `packages/common-ui/src/SupportPanel.test.tsx`: renders the Ko-fi link + iframe for a
  handle; shows no widget when the handle is absent.
- **Integration** — `apps/api/src/support/infrastructure/drizzle-donation-ledger.integration.test.ts`
  (Testcontainers): persists a donation, `wasRecorded` reflects it, re-recording the same `message_id`
  keeps a single row.
- **E2E** — `apps/web/e2e/support.spec.ts`: `/support` renders its heading; header + footer expose the
  Support link.

Run: `pnpm --filter @TheY2T/tmr-api test`, `pnpm --filter @TheY2T/tmr-common-ui test`,
`pnpm --filter @TheY2T/tmr-api test:integration`, `pnpm test:e2e`.
