# ADR 0035 — DB-backed feature flags with per-environment targeting, managed via the admin CMS

- **Status:** accepted
- **Date:** 2026-07
- **Supersedes:** ADR 0003 (OpenFeature + **flagd**). The OpenFeature *abstraction* from ADR 0003 is
  **kept** — every `@RequireFlagsEnabled` / `getBooleanValue` / `useFlag` call site is unchanged. Only the
  *provider backend* moves from the flagd container (reading `flags/flags.json`) to Postgres. The typed key
  registry (`@TheY2T/tmr-flags`) and the eval-context shape (`targetingKey`/`email`/`roles`) are unchanged.
- **Context:** Under ADR 0003 flag *values* lived in a single `flags/flags.json` bind-mounted into a
  self-hosted **flagd** container, identical for every environment. Toggling a dormant-but-shipped feature
  therefore meant editing a checked-in file and redeploying (or at least reloading flagd), there was **no
  notion of environments** (dev/uat/prod all read one file), and a non-engineer could not flip a flag. We
  want admins to toggle features **per environment, at runtime, from the CMS, with no redeploy** — the same
  goal ADR 0034 achieved for UI strings, applied to flags.

## Decision

1. **The database is the runtime source of truth for flags.** Five tables:
   `feature_flags` (one row per key — the registry), `feature_flag_environments` (CRUD-able
   dev/uat/prod + any admin-created env), `feature_flag_settings` (the **flag × environment** matrix — the
   per-env `enabled` master switch + `variants` + `targeting`), `feature_flag_revisions` (append-only
   audit), and `feature_flag_versions` (per-env version tag for cache-busting).
2. **A custom OpenFeature provider replaces flagd.** `@TheY2T/tmr-flags-eval` exports `TmrFlagProvider`
   (implements the OpenFeature server `Provider`) + a portable evaluator (`evaluateFlag`) that resolves a
   flag from an environment **snapshot** against the request context. It re-implements flagd-compatible
   targeting — JSONLogic (`if`/`in`/`var`/`==`/…) plus a murmur3-bucketed **`fractional`** operator — so
   authored rules (e.g. `demo.new-banner`'s role + 10% rollout) migrate verbatim. The **flagd container is
   removed.**
3. **Both tiers evaluate with the same engine, from a per-environment snapshot.**
   - **API** (`apps/api/src/feature-flags/`, hexagonal): resolves flags **in-process** via the
     `FeatureFlagCatalogue` read port (a version-tag-cached Drizzle adapter). `onApplicationBootstrap`
     sets `OpenFeature.setProvider(new TmrFlagProvider(new InProcessSnapshotSource(catalogue, APP_ENV)))`.
   - **Web SSR** never touches the DB (only the API does). The middleware fetches the snapshot from a new
     public `GET /feature-flags/snapshot/:env` (ETag → conditional GET → 304) and evaluates locally with the
     **same** `evaluateFlag` — so a flag resolves identically on both tiers.
4. **`enabled` is an admin master switch, not flagd's `state`.** Turning a flag off for an environment
   forces the off value regardless of the code default — which is what a CMS toggle must do. When enabled,
   an optional targeting rule (else `defaultVariant`) decides the value.
5. **The typed registry seeds + types + falls back.** `@TheY2T/tmr-flags` `FlagKeys`/`FlagDefaults`
   (+ `FlagTargeting`) remain the **compile-time type source** for gate sites, the **DB seed** (idempotent
   `seed-feature-flags.ts`, mirroring how `seed-i18n` seeds from the locales package — container-safe,
   never clobbers admin edits), and the **fallback** when the snapshot source is unavailable (defaults →
   the app still boots). The old `flags/flags.json` is retired.
6. **Full CRUD in the CMS.** `/admin/feature-flags` (`AdminFlagManager`): pick an environment, toggle any
   flag, edit its targeting (JSONLogic editor + role/percentage templates), create brand-new **runtime**
   keys, soft-delete/restore, view the revision history, manage environments, and import a flags.json-shaped
   payload. RBAC: a dedicated `featureFlags` permission resource — mutations **admin-only**, editors
   read-only (flags can gate auth, so blast radius is high).
7. **Immediate-apply, not draft/publish.** Unlike UI strings, a flag toggle applies immediately (that is
   the point). Safety comes from the **revision log + one-click restore**, not a publish gate.
8. **Near-instant propagation via the per-env version tag.** Every write bumps
   `feature_flag_versions[env]`; the read caches (API in-process + web HTTP) key on it, so a change is
   picked up within one request with **no redeploy or restart**.
9. **Environments are DB-managed.** A deployment names its environment via the new `APP_ENV` var (matches a
   `feature_flag_environments.key`; unmatched → the `is_default` env). Admins can add/edit environments.
10. **Self-lockout guardrail.** The CMS refuses to disable a flag that gates the admin surface
    (`admin.feature-flags`, `admin.cms`) **in the environment this deployment resolves against** — so an
    admin can't turn off the screen they're using. Other environments are unaffected; recovery is a reseed
    or SQL.

## Consequences

- **Pros:** toggle dormant features per environment at runtime with no redeploy; one fewer container
  (flagd gone); flags editable by non-engineers; full audit trail; the OpenFeature abstraction (and thus a
  future swap to another provider) is preserved; the web `Flags` shape is now *derived* from the registry
  (the old 88-field hand-sync drift is gone).
- **Cons / trade-offs:** we now own a small targeting evaluator (covered by parity unit tests against the
  migrated `demo.new-banner` rule); the web depends on the API's snapshot endpoint for flags (mitigated by
  in-process ETag caching + the `FlagDefaults` fallback, so an API blip degrades gracefully rather than
  failing SSR); admin-created runtime keys gate nothing until code references them (they are surfaced via
  `source: runtime` and `Astro.locals.flagSnapshot`).
- **Deferred:** a visual targeting rule builder (the editor is JSON + templates today); restore-**from-a-
  revision** (soft-delete restore exists; revision listing exists); a browser OFREP provider for live
  client updates (islands still receive flags as SSR props per ADR 0033).

See `docs/features/feature-flags.md`, `.claude/rules/flags.md`, and the `manage-flags` skill.
