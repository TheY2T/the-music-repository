---
paths:
  - "packages/flags/**"
  - "packages/flags-eval/**"
  - "apps/api/src/feature-flags/**"
  - "packages/web-data/src/flags.ts"
  - "packages/web-data/src/feature-flags-api.ts"
---

# Feature flags (ADR 0035, `docs/features/feature-flags.md`)

Flag **config is DB-backed** and toggled **per environment** in the admin CMS (`/admin/feature-flags`) —
the OpenFeature abstraction with a custom Postgres-backed provider
(`@TheY2T/tmr-flags-eval`); **flagd is gone**. The typed key registry (`@TheY2T/tmr-flags`) is the type
source + DB seed + fallback. Full lifecycle is the **`manage-flags`** skill.

## Adding a code flag

1. **Key** — add to `FlagKeys` + a boolean to `FlagDefaults` in `packages/flags/src/index.ts` (naming:
   `<domain>.<capability>`). If it targets (rollout/roles), add a rule to `FlagTargeting` there too.
2. **Web field** — map the key → its camelCase `Astro.locals.flags` field in `FLAG_FIELD_BY_KEY`
   (`packages/web-data/src/flags.ts`). The `Flags` type derives from this map (no hand-synced list).
3. **Gate** — api: `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })` (**method-level**;
   class-level drops route mapping). web: read `Astro.locals.flags.x` in the page, pass into islands as a
   **prop** (never read flags inside an island). It seeds into the DB on the next `db:seed`.

## How it resolves

- **api** evaluates in-process from the DB (`FeatureFlagCatalogue`, version-cached) for `APP_ENV`.
- **web SSR** fetches `GET /feature-flags/snapshot/:env` (ETag/304) and evaluates with the same engine.
- `enabled` (per-env) is an **admin master switch** — off ⇒ the feature is off regardless of the code
  default. When on, optional targeting (else `default_variant`) decides the value.

## Gotchas

- **No flagd, no `flags/flags.json`, no reload step.** A new code key goes live on `db:seed` (idempotent);
  toggling an existing flag in the CMS applies immediately (the env version tag bumps → caches invalidate).
- **`APP_ENV`** names which environment a deployment resolves against (dev/uat/prod; unmatched → default).
- **Admin CRUD is RBAC-gated** on the `featureFlags` permission resource — mutations admin-only. The CMS
  refuses to disable `admin.feature-flags`/`admin.cms` in the current environment (self-lockout guardrail).
- If the API/snapshot is unreachable, flags fall back to code `FlagDefaults` (the app still boots).
