# Feature: Feature-flag rig (OpenFeature + flagd)

- **Phase:** 0 · **Status:** shipped
- **Flag key:** `demo.new-banner` (demo; from `@TheY2T/tmr-flags`)

## Purpose

Establish the vendor-neutral flag infrastructure so every later phase can ship behind a flag. See
ADR [0003](../adr/0003-feature-flags-openfeature.md).

## UX behaviour

The landing page renders a banner island whose message depends on `demo.new-banner`. Flipping the
flag in `flags/flags.json` (or targeting a role via `x-user-roles`) changes API + web output.

## API contract

- `GET /demo/flags` → `{ demoNewBanner: boolean }` (imperative evaluation).
- `GET /demo/banner` → gated by `@RequireFlagsEnabled`; 404 when the flag is off, 200 when on.

## Wiring

- **api:** `apps/api/src/flags/` — `FeatureFlagsModule` (flagd provider + `contextFactory`), `DemoController`.
- **web SSR:** `apps/web/src/middleware.ts` evaluates into `Astro.locals.flags`.
- **web island:** `apps/web/src/components/FlagBanner.tsx` (react-sdk, seeded from SSR value).

## Graceful degradation

If flagd is unreachable the apps still boot and flags fall back to their defaults; a single hint
(`Could not reach flagd … run pnpm infra:up`) is logged instead of a stack trace. This is handled by
`apps/api/src/flags/flagd-logger.ts` and the equivalent logger in `apps/web/src/middleware.ts`.

## Tests / verify

Start infra: `pnpm infra:up`. Then:
- `curl localhost:3000/health` → `"database":"up"`.
- `curl -H 'x-user-roles: beta' localhost:3000/demo/flags` → `{"demoNewBanner":true}` (targeting hit);
  without the header → `false`.
- `curl -H 'x-user-roles: beta' localhost:3000/demo/banner` → 200; without → 404.
- Editing `flags/flags.json` hot-reloads flagd (no restart). Verified live in Phase 0.
