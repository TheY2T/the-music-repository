# ADR 0020 — Testing strategy: Vitest + Playwright + Testcontainers, dual-mode E2E

- **Status:** accepted
- **Date:** 2026-07
- **Context:** The monorepo was "test-ready" but had **zero tests** — Vitest was catalog-pinned,
  every package had a placeholder `test: "vitest run --passWithNoTests"`, and `turbo.json` wired a
  `test` task, yet no `vitest.config.*`, no Playwright, no CI, and no test file existed anywhere
  (`apps/api/tsconfig.json` even referenced a non-existent `vitest.config.ts`). We need a layered
  testing capability that prevents regressions and validates new features, consistent with the repo's
  conventions (shared-source-of-truth packages, catalogs, doc-driven DoD, hexagonal boundaries, flags).

## Decision

1. **Vitest is the unit/component runner everywhere** (already cataloged). Pinned to **3.2.x** — it
   gives AST-remapped v8 coverage and the `projects` API without the Vitest-4 major-bump integration
   risk against Astro's `getViteConfig` and NestJS/swc. v4 is a deliberate future bump, not a blocker.
2. **Per-package Vitest configs + Turbo caching** (Turborepo's recommended pattern), NOT a single
   root `projects`/`workspace` config — so each package/app stays independently cacheable. The Vitest
   `workspace` file is deprecated (3.2) and intentionally unused.
3. **A shared config package `@TheY2T/tmr-config-vitest`** (mirrors `config-eslint`/`config-typescript`
   — config-only, no build) exports `nodePreset()` / `reactPreset()` + a shared `coverage` block, so
   every `vitest.config.ts` is one line. It is the single source of truth for test config.
4. **Web** (`apps/web`) uses Astro's **`getViteConfig()`** so React islands, `@/*` aliases, and `.astro`
   compilation resolve in tests; **happy-dom** + **@testing-library/react** for islands. Coverage-worthy
   logic lives in `src/lib/*` (pure) and `src/middleware.ts` (SSR), kept out of `.astro` frontmatter.
5. **API** (`apps/api`, NestJS/commonjs) uses Vitest + **`unplugin-swc`** (decorator metadata) +
   `vite-tsconfig-paths`. Two tiers: **`test`** (unit — use-cases/domain by mocking **ports**, plus the
   problem+json filter over HTTP with `@nestjs/testing` + Supertest; no Docker) and **`test:integration`**
   (`*.integration.test.ts` — real Postgres via **Testcontainers** + Drizzle migrations; needs Docker).
6. **E2E is Playwright** (+ `@axe-core/playwright` for a11y), against the **production build** (`astro
   build` → node server), not dev.
7. **Dual-mode E2E** — the load-bearing decision. Because `apps/web` is **SSR**, backend fetches happen
   in the Astro Node process, where Playwright's browser-only `page.route()` can't reach. So:
   - **mock mode** (default, hermetic): the node server is started with an **MSW SSR preload**
     (`node --import ./e2e/msw/instrument.mjs`) that intercepts SSR fetches; a browser-route layer
     mirrors it for island fetches. flagd is pointed at a dead port → flags fall back to their defaults
     deterministically (no in-memory provider needed — the app already degrades gracefully).
   - **live mode** (`TMR_E2E_MODE=live`): serves against the real stack (`pnpm infra:up` + api, or the
     podman-compose stack).
   - **Service-subset mocking:** `TMR_E2E_MOCK_SERVICES=all|<comma-list>` selects which services MSW
     mocks; unlisted services `bypass` to the real backend. One switch gives "mock all" and "mock some,
     hit real for the rest."
8. **Coverage:** `@vitest/coverage-v8` (present in every test package). `pnpm test:coverage` runs it
   workspace-wide. Thresholds are per-package where logic lives; generated DTOs / `.astro` / barrels are
   excluded.
9. **CI (GitHub Actions):** a **fast lane** (`turbo run lint check-types test build`) on every push/PR,
   an **integration lane** (Testcontainers, Docker on `ubuntu-latest`), a **hermetic e2e lane** (mock
   mode, cached browsers), and a **live e2e lane** (manual/main).
10. **Docs are DoD:** every feature ships with tests (`docs/features/testing.md` + the **`add-tests`**
    skill), and the existing scaffolding skills gained a "Write tests" step.

## Test taxonomy

| Layer | Where | Runner / tier | Mocks |
|---|---|---|---|
| Shared package logic | `packages/*/src/*.test.ts` | Vitest node | none (pure) |
| Web pure lib / SSR | `apps/web/src/**/*.test.ts` | Vitest happy-dom | `fetch` / OpenFeature |
| Web islands | `apps/web/src/**/*.test.tsx` | Vitest + RTL | props (i18n-by-prop) |
| API use-case / domain | `apps/api/src/**/*.test.ts` | Vitest node | **ports** |
| API HTTP / problem+json | `apps/api/src/*.test.ts` | Vitest + Nest + Supertest | fake `LOGGER` |
| API adapter / repo | `apps/api/src/**/*.integration.test.ts` | Vitest + Testcontainers | real Postgres |
| User flows | `apps/web/e2e/*.spec.ts` | Playwright | MSW (mock) / real (live) |

## Consequences

- Regressions in logic, contracts, error mapping, i18n, and key user flows are caught pre-merge.
- One mental model (Vitest `vi` mocks) across web + api + packages; e2e is the single Playwright surface.
- The MSW SSR preload is a novel moving part (validated before the specs were written). `.mjs` in the
  e2e mock layer keeps it loadable by the `--import` preload without a build step.

## Alternatives considered

- **Root Vitest `projects` config** (single merged coverage): simpler reports but "any change → cache
  miss" for the whole workspace. Rejected for per-package caching.
- **Jest for the API:** safe, but Vitest unifies the runner with the web side and is the greenfield
  recommendation. Chosen Vitest + swc.
- **docker-compose for API integration tests:** shared state + port conflicts; Testcontainers gives
  isolated, self-cleaning Postgres per run. Chosen Testcontainers.
- **Playwright `page.route()` only** for E2E mocking: can't intercept SSR fetches (browser-only), so it
  would miss the middleware's session hop and any SSR data load. Chosen MSW-at-the-node-layer + a
  browser-route mirror.
- **Astro Container API for `.astro` unit tests:** attractive but, on Astro 7 + `getViteConfig`, the
  compiled component wasn't recognized as an Astro factory ("No valid renderer"). Given it is flagged
  experimental (breaking changes even in patches), `.astro` rendered output is asserted at the E2E layer
  instead; revisit when the Container API stabilizes.
- **Vitest 4:** recommended for greenfield, but the major bump risks the Astro/swc integrations. Deferred.
