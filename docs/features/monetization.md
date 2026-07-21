# Feature: Monetization — premium entitlements (Phase 6)

- **Phase:** 6 (Slice 1) · **Status:** shipped
- **Flag key:** `monetization.premium` (`FlagKeys.Premium`). Default on. See **ADR 0015**.

## Purpose

Gate `visibility = premium` content behind a paid tier. Premium items stay **discoverable** (they appear
in the catalogue with a 🔒 badge and a metadata-only preview) but their payload (score/recording/lesson)
is unlocked only for entitled users. Subscription is a **mock checkout** — a local stand-in for a payment
provider — so the whole flow is demonstrable offline.

## Access rule

**Entitled = staff (admin/editor) OR an active `premium` entitlement.** Staff bypass the paywall because
they author the content; subscribers hold a grant; everyone else sees locked previews.

## API (spec-first)

- `GET /me/subscription` → `SubscriptionStatus { premium, source ('subscription'|'staff'|'none'), since? }`.
- `POST /me/subscription/activate` → grants premium (mock checkout) and returns the new status.
- `DELETE /me/subscription` → cancels (204).
- All three require auth and are gated by `monetization.premium` (disabled → 404).
- Catalogue: `GET /catalogue/items` sets `locked` on premium summaries for non-entitled viewers;
  `GET /catalogue/items/{slug}` returns a **locked preview** (no `bodyMdx`, no media URLs) for
  premium content a viewer isn't entitled to.

## Architecture (hexagonal)

- **`apps/api/src/entitlements/`** — `Entitlements` port (`getPremium`/`grantPremium`/`revokePremium`) ←
  `DrizzleEntitlements`; request-scoped `PremiumAccessService` (CurrentUser + Entitlements → the rule);
  `SubscriptionController`. `entitlements` table (ADR 0015).
- **Catalogue gating:** the controller resolves `entitled` (flag on? then `PremiumAccessService.isEntitled()`)
  and passes a plain boolean into the pure `SearchCatalogue` / `GetContentBySlug` use-cases. The public
  read routes use `ResolveOptionalAuth()` so `CurrentUser` sees a logged-in viewer without blocking anon.
  Search covers only published items; the use-case computes `locked`.
- **Web:** `src/lib/subscription-api.ts` (credentialed get/activate/cancel); `UpgradePanel.tsx` +
  `/upgrade` page (login + flag gated); a 🔒 Premium badge on catalogue cards (`CatalogueBrowser`) and a
  locked upgrade panel on the detail page (`ContentDetail`) driven by `item.locked`.

## Seed

Two seed items are `visibility: 'premium'` — `czerny-op-599-no-1` (with a gated PDF) and
`omt-diatonic-chords`. The seed upsert now updates `visibility` so re-seeds reflect changes.

## Tests (verified)

- **curl:** anon/learner → premium detail `locked:true`, no body/media (PDF withheld, `media:0`); after
  `POST /me/subscription/activate` → `locked` gone, `media:1` with a media URL; `DELETE` →
  locked again; admin → `{premium:true, source:'staff'}` and unlocked; anon `GET /me/subscription` → 401;
  search flags both premium items `locked:true`.
- **Web (browser):** learner sees a 🔒 Premium badge on both premium cards and a locked upgrade panel on
  the detail page; `/upgrade` shows Free plan → **Activate** → "Premium active" + Cancel; after activating,
  the premium item renders its score; staff see it unlocked.
- Build/lint/check-types green across the workspace (25/25); spec regenerated.

## Related

- **Teacher/classroom mode (Slice 2)** grants premium at the class level — a teacher grants a `premium`
  entitlement (`source: 'classroom'`) to every member. See `docs/features/classrooms.md`.

## Next (Phase 6 later)

- Real payment provider (Stripe checkout + webhook → `grantPremium`); the port/table already carry
  `source` + `expires_at`.
