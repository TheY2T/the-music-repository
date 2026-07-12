# ADR 0016 — Billing via Stripe Checkout behind a `CheckoutGateway` port (mock default)

- **Status:** accepted
- **Phase:** 6 (monetization) · builds on ADR 0015 (entitlements)

## Context

Phase 6 Slice 1 shipped premium **entitlements** with a *mock* activate endpoint. To turn that into
real revenue we need a payment provider (Stripe), but real API keys aren't provisioned yet — and
tests/CI must never call Stripe. We want the payment integration ready to switch on with keys, without
coupling app code to Stripe.

## Decision

Model payments as **adapters behind a port**, mirroring ADR 0012 and the "grant is provider-agnostic"
principle from ADR 0015:

- **`CheckoutGateway` port** (application) — the capability of *starting a provider checkout* and
  *verifying + normalizing its webhooks* into a provider-agnostic `BillingEvent`. App code depends
  only on this port.
- **Two adapters:** `MockCheckoutGateway` (default) and `StripeCheckoutGateway`. The module's factory
  provider picks by env: `STRIPE_SECRET_KEY` set → Stripe, else mock. The mock returns a local
  checkout-page URL and resolves its webhook back to the user via a persisted session; Stripe uses
  Checkout Sessions + `stripe.webhooks.constructEvent` signature verification.
- **Grants flow through the webhook, not the checkout call.** `POST /me/checkout` only returns a
  redirect URL; premium is granted when `POST /billing/webhook` receives `checkout.session.completed`
  and calls the existing `Entitlements.grantPremium` — exactly as real Stripe works. Cancellation via
  `customer.subscription.deleted` → `revokePremium`.
- **Idempotency:** a `WebhookLedger` (`processed_webhooks` table) records handled event ids so retried
  deliveries are no-ops. A `checkout_sessions` table correlates provider sessions/subscriptions → user.
- **The webhook is an inbound provider endpoint**, kept **out of the TypeSpec client contract** (like
  Better Auth's routes) and unauthenticated (verified by signature instead).

## Consequences

- The mock exercises the entire flow (checkout → webhook → grant) in dev/CI with no keys or charges;
  the `/upgrade` UI redirects to a mock checkout page whose "Pay" simulates the provider firing the
  webhook. Switching to real Stripe is config-only (set the three env vars).
- **Raw-body caveat:** Stripe signature verification needs the exact request bytes. Global
  `bodyParser: false` + the Better Auth module's re-parsing mean `req.rawBody` isn't captured yet; the
  controller falls back to re-serializing the parsed body, which suffices for the mock (it ignores the
  signature) but must gain true raw-body capture on the webhook route when real keys land. Tracked as
  the remaining "webhook hardening" backlog item.
- **Subscription lifecycle** (renewal/expiry from `invoice.paid`, billing portal) is deferred; the mock
  sets a 30-day expiry to exercise the `expires_at` path (which `Entitlements.getPremium` already honors).
