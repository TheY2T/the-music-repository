# Feature: Gift / redeem codes + entitlement audit log

- **Phase:** 6 (6B) · **Status:** shipped
- **Flag key:** `monetization.premium` (reused) — gates the endpoints.
- **ADR:** builds on 0015 (entitlements) / 0016 (billing).

## Purpose

Grant premium **without a card** via one-time (or multi-use) gift codes — for support, promos, and
teacher/institution comps — and keep an **audit trail** of every entitlement change.

## Gift / redeem codes (`apps/api/src/redemption/`)

- **Table `redeem_codes`** — `code` (pk), `key` (default `premium`), `source` (`redeem`),
  `duration_days` (null = no expiry), `uses_remaining`, `created_by`. Mirrors the classroom join-code
  pattern.
- **Port `RedeemCodeStore`** ← `DrizzleRedeemCodeStore`. `consume` decrements `uses_remaining` in a
  single atomic `UPDATE ... WHERE uses_remaining > 0 RETURNING *`, so concurrent redeems can't
  over-consume.
- **Use-cases:** `CreateRedeemCode` (staff-only — checks `CurrentUser` roles → 403 `NOT_STAFF`; accepts
  a `tier` = the entitlement key, `premium` default or `pro`), `RedeemCode` (consumes a use →
  `Entitlements.grant(userId, code.key, 'redeem', expiresAt)`). A `pro` code grants a `pro` entitlement
  (see tiered plans below).

| Route | Auth | Result |
|---|---|---|
| `POST /admin/redeem-codes` | `@RequireAuth` + `monetization.premium`; staff-only (use-case) | `{ code }` (201) |
| `POST /me/redeem` | `@RequireAuth` + `monetization.premium` | `{ redeemed, expiresAt }`; invalid/exhausted → 404 |

## Entitlement audit log (`apps/api/src/entitlements/`)

- **Table `entitlement_events`** (append-only) — `user_id`, `key`, `action` (`grant`/`revoke`),
  `source`, `created_at`. `DrizzleEntitlements.grantPremium`/`revokePremium` append an event on every
  change, so every grant path (subscription, classroom, redeem, staff) is captured automatically.
- **`GET /me/entitlements/history`** → `{ items: [{ key, action, source, at }] }`, most-recent first.

## Tiered plans (Phase 6, 6B)

- **Content `tier`** (`content_items.tier`, null = `premium`): which plan unlocks a premium item —
  `premium` or `pro`. Ranked in the catalogue domain (`TIER_RANK` = `{ premium: 1, pro: 2 }`); `pro` ⊃
  `premium`.
- **Entitlements are keyed** (`entitlements.key` = `premium` | `pro`). `Entitlements.grant(userId, key,
  …)` + `activeKeys(userId)`; `grantPremium` is `grant(_, 'premium', …)`. `PremiumAccessService.
  viewerEntitlement()` returns `{ staff, keys }`.
- **Catalogue gating is per-tier:** the controller resolves the viewer's **rank** (`entitledRank(keys)`,
  or Infinity for staff / flag off) and the use-cases lock a premium item when
  `viewerRank < tierRank(item.tier)`. So a `premium` grant unlocks `premium` content but **not** `pro`.
  `ContentSummary`/`ContentDetail` carry `tier`; web shows a **🔒 Premium** / **🔒 Pro** badge.
- **Granting `pro`:** a `pro` redeem code today (pro-via-Stripe-checkout is a small follow-on).

## Verification

- Redeem: learner mints → **403 `NOT_STAFF`**; admin mints (uses:2) → 201; learner redeems → premium
  `source:redeem` + `expiresAt` +30d; **audit log** shows the grant; invalid code → 404; a 1-use code
  redeemed twice → 201 then **404 (exhausted)**.
- **Tiered:** with no entitlement, both a `premium` and a `pro` item are locked; after redeeming a
  **premium** code the premium item unlocks but the **pro item stays locked**; after redeeming a **pro**
  code the pro item unlocks. Verified on both the list (`locked` + `tier`) and detail endpoints + the
  web lock badges.
- All via curl + browser; `build lint check-types` green; spec drift clean; domain framework-free.
