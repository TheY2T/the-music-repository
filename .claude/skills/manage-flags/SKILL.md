---
name: manage-flags
description: Add, gate, and verify an OpenFeature/flagd feature flag in The Music Repository — register the typed key in @TheY2T/tmr-flags, define it in flags/flags.json, then gate the API route (@RequireFlagsEnabled) and web usage (SSR eval → island prop). Use whenever shipping a feature behind a flag or wiring an existing flag. See docs/features/feature-flags.md + ADR 0003.
---

# manage-flags

Every feature ships behind a flag. A flag has **two sources that must stay in sync** — the typed key
registry and the flagd config — plus the gates that read it.

## 1. Register the key (source of truth)

Add to `FlagKeys` in `packages/flags/src/index.ts`. Naming convention: **`<domain>.<capability>`**
(e.g. `learning.collections`, `tools.keyboard`, `monetization.premium`). Add a one-line JSDoc saying what
it gates + its phase. This registry is imported by **both** the API and web, so keys evaluate identically.

## 2. Define it in flagd

Add the flag to `flags/flags.json` (flagd schema):

```json
"<domain>.<capability>": {
  "state": "ENABLED",
  "variants": { "on": true, "off": false },
  "defaultVariant": "on"
}
```

Deferred/not-ready features default `"off"`. Keep the `FlagDefaults` (if the feature has one) consistent.

## 3. Gate the code

- **API:** `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })` on the route. Use **method-level**
  for deferred features — a class-level decorator drops the route mapping entirely. Evaluate imperatively
  with an injected `@OpenFeatureClient()` when you need a value mid-use-case.
- **Web:** `src/middleware.ts` evaluates flags per request into `Astro.locals.flags`. Read the flag in the
  page frontmatter and **pass it into the island as a prop** so first paint matches the server — never call
  `useFlag` inside an island for gating.

## 4. Verify

- **Reload flagd after adding a key:** `docker compose -f infra/podman/compose.yaml restart flagd` — a new
  key that flagd hasn't loaded makes `@RequireFlagsEnabled` route-gates **404** (while the imperative
  `getBooleanValue(default)` path still returns the default). This is the #1 gotcha.
- flagd must be running (`pnpm infra:up`); without it, providers return defaults and log one graceful hint.
  **Don't** add a disable-flag env toggle — the hint is intended behaviour.
- Toggle the flag off and confirm the feature disappears (API 404s / route redirects; web hides the UI).
- Add the flag key to the feature's `docs/features/<feature>.md` (**`add-feature-doc`**).
