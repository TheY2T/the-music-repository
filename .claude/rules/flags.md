---
paths:
  - "flags/**"
  - "packages/flags/**"
---

# Feature flags (ADR 0003, `docs/features/feature-flags.md`)

OpenFeature + flagd. Every flag has **two** touch-points that must stay in sync — the typed key registry
and the flagd config. Full lifecycle is the **`manage-flags`** skill.

1. **Key** — add to `FlagKeys` in `packages/flags/src/index.ts` (naming: `<domain>.<capability>`, e.g.
   `learning.collections`). This is the single source of truth for keys + the `FlagEvaluationContext`
   shape (`targetingKey`/`email`/`roles`), imported by both api and web.
2. **Definition** — add the flag to `flags/flags.json` (flagd schema: `state`, `variants` `on/off`,
   `defaultVariant`).
3. **Gate** — api: `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })` (**method-level** for
   deferred features; class-level drops route mapping). web: evaluate in `middleware.ts` → `Astro.locals.
   flags`, pass into islands as **props** (never read flags inside an island).

## Gotchas

- **New flag keys need flagd reloaded** (`docker compose … restart flagd`) or `@RequireFlagsEnabled`
  route-gates 404 while the imperative `getBooleanValue(default)` path still works.
- flagd must be running (`pnpm infra:up`) for live evaluation; otherwise providers return defaults and a
  single graceful hint is logged — **don't** add a disable-flag env toggle.
