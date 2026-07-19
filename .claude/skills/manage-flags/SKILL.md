---
name: manage-flags
description: Add, gate, toggle, and verify a DB-backed feature flag in The Music Repository — register the typed key in @TheY2T/tmr-flags, map its web field, gate the API route (@RequireFlagsEnabled) and web usage (SSR eval → island prop), then toggle it per-environment in the admin CMS (/admin/feature-flags) with no redeploy. Use whenever shipping a feature behind a flag or wiring an existing flag. See docs/features/feature-flags.md + ADR 0035.
---

# manage-flags

Flag **config is DB-backed** and toggled **per environment** in the admin CMS with **no redeploy** (ADR
0035). The OpenFeature abstraction is kept — every gate site is unchanged — but the provider is a custom
Postgres-backed one (`@TheY2T/tmr-flags-eval`); **flagd is gone**. To *ship* a new code flag you touch the
typed registry + the gate; to *toggle* an existing one you use the CMS.

## 1. Register the key (type source + DB seed + fallback)

Add to `FlagKeys` **and** a boolean to `FlagDefaults` in `packages/flags/src/index.ts`. Naming:
**`<domain>.<capability>`** (e.g. `learning.collections`, `tools.keyboard`). One-line JSDoc = what it
gates + phase. This registry is imported by both API and web, **seeds the DB** (`seed-feature-flags.ts`,
idempotent), and is the **fallback** when the snapshot source is down. If the flag needs a rollout/role
rule at seed time, add it to `FlagTargeting` in the same file.

## 2. Map the web field

Add the key → its camelCase `Astro.locals.flags` field in `FLAG_FIELD_BY_KEY`
(`packages/web-data/src/flags.ts`). The `Flags` type derives from this map — a missing mapping won't
compile. (Bespoke names exist: `platform.i18n` → `i18nEnabled`, `learning.dashboard` → `learnerDashboard`.)

## 3. Gate the code

- **API:** `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })` on the route — **method-level**
  (class-level drops the route mapping). Evaluate imperatively with an injected `@OpenFeatureClient()` when
  you need a value mid-use-case (the provider now reads the DB, not flagd).
- **Web:** the middleware evaluates flags per request into `Astro.locals.flags`. Read the flag in the page
  frontmatter and **pass it into the island as a prop** — never `useFlag` inside an island for gating.

## 4. Seed + toggle

- **New code key:** `pnpm --filter @TheY2T/tmr-api db:seed` (idempotent — seeds the flag into every
  environment; never clobbers admin edits). No flagd reload, no `flags.json`.
- **Toggle an existing flag:** in `/admin/feature-flags` pick the environment and flip **Enabled** (or edit
  its targeting). It applies **immediately** — the env version tag bumps and the API/web caches invalidate
  within a request. Mutations are admin-only (RBAC `featureFlags`). The CMS refuses to disable
  `admin.feature-flags`/`admin.cms` in the environment you're resolving through (self-lockout guardrail).

## 5. Verify

- `curl :3000/feature-flags/snapshot/dev` shows the flag; toggle it off for `dev` in the CMS → the gated
  route flips (API 404 / web redirect) with **no restart**, while `uat`/`prod` stay as they were.
- If the API/snapshot is unreachable, flags fall back to code `FlagDefaults` (the app still boots).
- Add the flag key to the feature's `docs/features/<feature>.md` (**`add-feature-doc`**).
