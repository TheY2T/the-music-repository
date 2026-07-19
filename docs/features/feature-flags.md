# Feature: DB-backed feature flags (per-environment, admin-managed)

- **Status:** shipped · **Flag (admin surface):** `admin.feature-flags`
- **ADR:** [0035](../adr/0035-db-backed-feature-flags.md) (supersedes [0003](../adr/0003-feature-flags-openfeature.md))

## Purpose

Flag *configuration* lives in **Postgres** and is toggled **per environment (dev/uat/prod + any
admin-created env)** from the admin CMS. Flags are evaluated through OpenFeature — `@RequireFlagsEnabled`
(api) / `Astro.locals.flags` (web) / `useFlag` (islands) — backed by a custom Postgres provider
(`@TheY2T/tmr-flags-eval`).

## Data model (`apps/api/src/infrastructure/database/schema.ts`)

- `feature_flags` — one row per key (the registry). `source` = `code` (mirrors `@TheY2T/tmr-flags`) or
  `runtime` (admin-created). Soft-deletable.
- `feature_flag_environments` — CRUD-able environments; a deployment resolves its own via `APP_ENV`
  (matches `key`; unmatched → the `is_default` env).
- `feature_flag_settings` — the **flag × environment** matrix: `enabled` (admin master switch),
  `default_variant`, `variants`, `targeting` (JSONLogic, nullable).
- `feature_flag_revisions` — append-only audit (who/what/when, before/after).
- `feature_flag_versions` — per-env version tag; the ETag + cache-bust signal.

## Evaluation

- **Engine:** `@TheY2T/tmr-flags-eval` — `evaluateFlag(snapshot, key, ctx, fallback)` + `TmrFlagProvider`
  (OpenFeature `Provider`). Targeting is a JSONLogic subset (`if`/`in`/`var`/`==`/…) plus a
  murmur3-bucketed **`fractional`** rollout.
- **Semantics:** flag absent → code `FlagDefaults` (reason DEFAULT); `enabled=false` → off (DISABLED);
  else targeting match → variant (TARGETING_MATCH); else `default_variant` (STATIC).
- **API** (in-process): `FeatureFlagCatalogue` read port + version-cached Drizzle adapter;
  `FeatureFlagsModule` sets the provider on bootstrap with `InProcessSnapshotSource(catalogue, APP_ENV)`.
- **Web SSR** (no DB access): `apps/web/src/middleware.ts` fetches `GET /feature-flags/snapshot/:env`
  (ETag → 304) via `HttpSnapshotSource` and evaluates with the same engine into `Astro.locals.flags`
  (typed, derived from the registry) + `Astro.locals.flagSnapshot` (raw map incl. runtime keys).

## API contract

Public read (feeds the web provider):
- `GET /feature-flags/snapshot/:env` → evaluatable snapshot (ETag = per-env version; conditional GET → 304).
- `GET /feature-flags/environments` → active environments.

Admin CRUD — `/admin/feature-flags/*`, method-level `@RequireFlagsEnabled(admin.feature-flags)` +
`@RequirePermissions({ featureFlags: [...] })` (mutations admin-only; editors read):
- Flags: `GET/POST /flags`, `PUT/DELETE /flags/:id`, `POST /flags/:id/restore`,
  `PUT /flags/:id/settings/:envId` (toggle + targeting), `GET /flags/:id/revisions`, `GET /revisions`,
  `POST /import`.
- Environments: `GET/POST /environments`, `PUT/DELETE /environments/:id`.

## UX

`/admin/feature-flags` (`AdminFlagManager`, gated by `admin.feature-flags` + admin role): environment
picker, searchable/paginated flag table with a per-env **enabled** toggle, a **targeting** editor (JSONLogic
+ role/percentage templates), **create runtime flag**, **delete/restore**, **history**, **environments**
management, and **import** (flags.json-shaped). Self-lockout guardrail: the API refuses to disable
`admin.feature-flags` / `admin.cms` in the environment this deployment resolves against.

## Registry (`@TheY2T/tmr-flags`)

The compile-time type source for gate sites, the DB **seed** (`seed-feature-flags.ts`, idempotent, seeds
from the package; never clobbers admin edits), and the **fallback** when the snapshot source is
unavailable. Adding a new **code** flag: add the key to `FlagKeys` + `FlagDefaults`
(one line each), map its camelCase web field in `@TheY2T/tmr-web-data`'s `FLAG_FIELD_BY_KEY`, gate the
code, then it seeds on the next `db:seed`. See the **`manage-flags`** skill.

## Graceful degradation

If the snapshot source is unavailable, both tiers fall back to code `FlagDefaults`, so evaluation always
returns a value.

## Tests / verify

- Unit: `packages/flags-eval` (targeting + `fractional` parity with `demo.new-banner`);
  `feature-flag.use-cases.test.ts` (self-lockout guard, key conflicts).
- Component: `AdminFlagManager.test.tsx`.
- Integration: `drizzle-feature-flag-catalogue.integration.test.ts` (seed + snapshot + version cache).
- Verify live: seed, then `curl :3000/feature-flags/snapshot/dev`; toggle a flag for `dev` in the CMS →
  the gated route flips (404 api / redirect web) with **no restart**, while `uat`/`prod` are unaffected.
