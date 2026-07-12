# ADR 0015 — Monetization: premium entitlements (Phase 6)

- **Status:** accepted
- **Date:** 2026-07-12
- **Context:** Phase 6 gates `visibility = premium` content behind a paid tier, without a real payment
  provider wired yet.

## Decision

Model premium access as **entitlements that complement RBAC**, not as an extra role:

- **`entitlements` table** (`user_id`, `key`, `source`, `granted_at`, `expires_at`) — a premium grant is
  a row with `key = 'premium'`. `expires_at` null = no expiry. This is a local stand-in for a payment
  provider's subscription record.
- A new hexagonal **`entitlements/` feature**: the `Entitlements` port (`getPremium` / `grantPremium` /
  `revokePremium`) ← `DrizzleEntitlements`; a request-scoped **`PremiumAccessService`** that combines the
  `CurrentUser` port with `Entitlements` into the access rule **entitled = staff (admin/editor) OR active
  premium grant**.
- **Gating is a locked preview, not a hard 403.** Premium items stay discoverable in the catalogue:
  search flags them `locked`, and the detail endpoint returns metadata only (no `bodyMdx`, no presigned
  media) for non-entitled viewers. Entitled viewers get the full payload. This is set in the catalogue
  use-cases from a plain `entitled` boolean the controller resolves — the use-cases stay pure.
- **Subscription flow is a mock checkout.** `POST /me/subscription/activate` grants the entitlement
  directly (standing in for a Stripe webhook); `GET /me/subscription` reports status; `DELETE` cancels.
  Gated by the `monetization.premium` flag.

## Why entitlements, not a role

A user's role (learner/editor/admin) is orthogonal to whether they pay — an editor is also staff, a
learner may or may not subscribe. Entitlements are a separate, expirable, multi-key concept that layers
on top of RBAC. Staff bypass the paywall because they author/manage the content. Per the plan (§3.6),
this is the "entitlement flags targeted by role, complementing RBAC" idea, backed by real data.

## Consequences / gotchas

- **Resolving the viewer on public routes:** the catalogue is anonymous-viewable (no global auth guard),
  so `CurrentUser` normally can't see a logged-in user there. The gated read routes use the library's
  **`@OptionalAuth()`** (wrapped as our `ResolveOptionalAuth()`) so the session is resolved when present
  without rejecting anonymous.
- **`@RequireFlagsEnabled` must be method-level**, not class-level (class-level dropped route mapping).
- **flagd must load a new flag key** before `@RequireFlagsEnabled` sees it — restart/reload flagd after
  adding to `flags/flags.json`, or route gating 404s while the imperative default-`true` path still works.
- Real payment-provider integration (Stripe checkout + webhook → `grantPremium`) is a later slice; the
  port/table are already shaped for it (`source`, `expires_at`).
