# Feature: Billing — Stripe Checkout + webhook (mock default)

- **Phase:** 6 · **Status:** shipped (mock gateway; Stripe adapter ready, dormant until keys)
- **Flag key:** `monetization.premium` (reused) — gates `/me/checkout` + the `/upgrade` flow.
- **ADR:** 0016 (builds on 0015 entitlements).

## Purpose

Turn the mock "activate" into a real checkout flow: start a provider checkout, and grant premium from
the **provider webhook** on completion — the way Stripe actually works — while staying runnable in
dev/CI with **no keys and no charges** via a mock gateway.

## Flow

```
/upgrade  ──Subscribe──►  POST /me/checkout ──►  { url }
   ▲                                               │ redirect
   │ status=success                                ▼
   │                        (mock) /upgrade/checkout  ──Pay──►  POST /billing/webhook
   │                                                              │ checkout.session.completed
   └───────────────  grant premium (Entitlements.grantPremium) ◄──┘
```

With real Stripe keys the checkout URL points at Stripe's hosted page and Stripe fires the webhook
server-side; the browser never touches `/billing/webhook`.

## API

| Route | Auth | Result |
|---|---|---|
| `POST /me/checkout` | `@RequireAuth` + `monetization.premium` | `{ url }` to redirect to (in TypeSpec) |
| `POST /billing/webhook` | none (signature) | `{ received: true }`; grants/revokes premium (NOT in TypeSpec — inbound provider endpoint, like Better Auth) |

`/me/subscription` (status) and `DELETE /me/subscription` (cancel) are unchanged (ADR 0015). The old
`POST /me/subscription/activate` remains as a dev shortcut but the UI now uses checkout.

## Architecture (hexagonal, ADR 0012 + 0016)

`apps/api/src/billing/`:
- **Port `CheckoutGateway`** (create session + verify/normalize webhook → `BillingEvent`), bound by a
  factory to `MockCheckoutGateway` (default) or `StripeCheckoutGateway` (when `STRIPE_SECRET_KEY` set).
- **Port `CheckoutSessionStore`** ← `DrizzleCheckoutSessionStore` (`checkout_sessions` — maps a
  provider session/subscription back to the user; holds Stripe customer/subscription ids).
- **Port `WebhookLedger`** ← `DrizzleWebhookLedger` (`processed_webhooks` — idempotency by event id).
- **Use-cases:** `StartCheckout` (gateway + store), `HandleBillingWebhook` (gateway → `Entitlements`
  grant/revoke, idempotent).
- Domain `BillingEvent` (activate/cancel) is framework-free; `WebhookVerificationError` → 4xx problem+json.
- Imports `EntitlementsModule` (grants go through the existing `Entitlements` port) + `AuthModule`.

## Config (`apps/api/src/config/env.ts`)

`STRIPE_SECRET_KEY?`, `STRIPE_PRICE_ID?`, `STRIPE_WEBHOOK_SECRET` (default `whsec_mock_dev_secret`),
`WEB_BASE_URL`. Unset `STRIPE_SECRET_KEY` → mock gateway. See `.env.example`.

## Web

- `src/lib/subscription-api.ts` — `startCheckout()` + `completeMockCheckout(sessionId)` (dev-only mock
  webhook trigger). `UpgradePanel` "Subscribe" → `startCheckout` → redirect.
- `/upgrade/checkout` (`MockCheckout.tsx`) — dev-only mock checkout page; "Pay" fires the mock webhook
  then returns to `/upgrade?status=success`. Never reached with real Stripe.

## Verification

- **API (curl, learner):** anon checkout → 401; `POST /me/checkout` → mock URL; webhook
  `checkout.session.completed` → 200 + `premium:true source:subscription`; **replayed event →
  idempotent** (still premium, no error); `customer.subscription.deleted` → `premium:false`.
- **Web (browser):** Free plan → Subscribe → mock checkout page → Pay → `?status=success` → "✓ Premium
  active" (`premium:true`). Verified end-to-end; test user reset afterwards; artifacts cleaned.
- `pnpm build lint check-types` green (25/25); spec drift clean; domain framework-free.

## Follow-ups (open in `docs/backlog.md`)

Real Stripe keys → flip env; add **raw-body capture** on the webhook route (signature needs exact
bytes); **subscription lifecycle** (renew on `invoice.paid`, `expires_at` from billing period);
**billing portal**; seat billing. The mock sets a 30-day expiry to exercise the `expires_at` path.
