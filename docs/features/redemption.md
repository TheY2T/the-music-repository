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
- **Use-cases:** `CreateRedeemCode` (staff-only — checks `CurrentUser` roles → 403 `NOT_STAFF`),
  `RedeemCode` (consumes a use → `Entitlements.grantPremium(userId, 'redeem', expiresAt)`).

| Route | Auth | Result |
|---|---|---|
| `POST /admin/redeem-codes` | `@RequireAuth` + `monetization.premium`; staff-only (use-case) | `{ code }` (201) |
| `POST /me/redeem` | `@RequireAuth` + `monetization.premium` | `{ redeemed, expiresAt }`; invalid/exhausted → 404 |

## Entitlement audit log (`apps/api/src/entitlements/`)

- **Table `entitlement_events`** (append-only) — `user_id`, `key`, `action` (`grant`/`revoke`),
  `source`, `created_at`. `DrizzleEntitlements.grantPremium`/`revokePremium` append an event on every
  change, so every grant path (subscription, classroom, redeem, staff) is captured automatically.
- **`GET /me/entitlements/history`** → `{ items: [{ key, action, source, at }] }`, most-recent first.

## Verification

- Redeem: learner mints → **403 `NOT_STAFF`**; admin mints (uses:2) → 201; learner redeems → premium
  `source:redeem` + `expiresAt` +30d; **audit log** shows the grant; invalid code → 404; a 1-use code
  redeemed twice → 201 then **404 (exhausted)**.
- All via curl; `build lint check-types` green; spec drift clean; domain framework-free.
