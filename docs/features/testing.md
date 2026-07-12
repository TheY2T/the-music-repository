# Testing

Layered automated testing across the monorepo: **Vitest** for unit/component, **Playwright** for E2E,
**Testcontainers** for API integration. See ADR 0020 for the decisions. Testing is part of the
Definition of Done — every feature ships with tests (skill: **`add-tests`**).

## Layers & where tests live

| Layer | Location | Command |
|---|---|---|
| Shared package logic | `packages/*/src/*.test.ts` | `pnpm test` |
| Web pure lib / middleware / api-clients | `apps/web/src/**/*.test.ts` | `pnpm test` |
| Web React islands | `apps/web/src/**/*.test.tsx` | `pnpm test` |
| API use-cases / domain / HTTP filter | `apps/api/src/**/*.test.ts` | `pnpm test` |
| API adapters / repositories | `apps/api/src/**/*.integration.test.ts` | `pnpm test:integration` |
| User flows (E2E) | `apps/web/e2e/*.spec.ts` | `pnpm test:e2e` |

## Commands (root)

```bash
pnpm test              # unit + component across the workspace (Turbo-cached)
pnpm test:watch        # watch mode (apps/web + apps/api)
pnpm test:coverage     # v8 coverage, workspace-wide
pnpm test:integration  # API Testcontainers tier (needs Docker/podman)
pnpm test:e2e          # Playwright, mock mode (hermetic — no stack needed)
pnpm test:e2e:live     # Playwright against the real stack (infra:up + api)
```

Per-package: `pnpm --filter @TheY2T/tmr-<pkg> exec vitest` (watch), `… run --coverage`.

## Config

- Runner config is one line per package: `defineConfig(nodePreset())` (or `getViteConfig({ test:
  reactPreset({…}).test })` for web), from **`@TheY2T/tmr-config-vitest`** — the single source of truth
  for env/globals/coverage. Add a new testable package by dropping in a `vitest.config.ts` like this.
- **Web** uses Astro's `getViteConfig()` (React + `@/*` + `.astro` all resolve); env = **happy-dom**.
  Override per-file with `// @vitest-environment jsdom` when the fuller DOM API is needed.
- **API** uses `unplugin-swc` for NestJS decorators; unit tier excludes `*.integration.test.ts`.

## Writing tests — the patterns

- **Pure logic / domain:** import and assert. Keep logic out of `.astro` frontmatter and out of
  adapters so it's unit-testable.
- **API use-cases:** construct the use-case with **mocked ports** (`{ search: vi.fn() }`) — no Nest DI
  container. See `apps/api/src/catalogue/application/use-cases/search-catalogue.use-case.test.ts`.
- **API HTTP / errors:** `@nestjs/testing` + Supertest through a throwaway controller; assert RFC 9457
  problem+json. See `apps/api/src/platform-problem-details.test.ts`.
- **API adapters:** Testcontainers Postgres + Drizzle migrations. See
  `apps/api/src/health/infrastructure/drizzle-datastore-health-check.integration.test.ts`.
- **React islands:** `@testing-library/react`, pass `locale` as a prop (i18n-by-prop), render the
  **island root** (context doesn't cross islands). See
  `apps/web/src/components/LanguageSwitcher.test.tsx`.
- **i18n:** the `en`↔`zh-Hans` catalogue guard lives in `packages/i18n-locales/src/index.test.ts`
  (no orphan keys, no blank values); resolver behaviour in `packages/i18n/src/index.test.ts`.
- **Selectors (E2E):** prefer `getByRole` / `getByLabel` / `getByText`, then `getByTestId`. Web-first
  assertions auto-wait — no manual sleeps.

> `.astro` components are **not** unit-tested (the Astro 7 Container API isn't stable under Vitest — ADR
> 0020). Their rendered output is asserted at the E2E layer.

## E2E: dual-mode + service mocking

Because `apps/web` is SSR, backend fetches happen in the Astro **Node** process. So mocking has two
layers, driven by env:

- **`TMR_E2E_MODE=mock`** (default) — the node server boots with an **MSW SSR preload**
  (`e2e/msw/instrument.mjs`, via `node --import`) intercepting SSR fetches; `e2e/mocks/browser-routes.ts`
  mirrors it for island (browser) fetches. flagd is pointed at a dead port → flags use their defaults.
- **`TMR_E2E_MODE=live`** — serves against the real stack. Bring it up with `pnpm infra:up` + a running
  api (or the full podman-compose stack), then `pnpm test:e2e:live`.
- **`TMR_E2E_MOCK_SERVICES`** — `all` (default) or a comma list (e.g. `auth,catalogue`). Listed services
  are mocked; **unlisted services pass through to the real backend** — so you can mock everything, or
  mock a subset and hit the real API for the rest.

**Add a mockable service:** add its name to `SERVICE_NAMES` in `e2e/mocks/data.mjs`, add MSW handlers
in `e2e/msw/handlers.mjs`, and (if islands call it client-side) a `page.route` in
`e2e/mocks/browser-routes.ts`.

**Auth reuse:** `e2e/auth.setup.ts` saves a `storageState` per role (mock mode injects the recognised
session cookie; live mode does a real sign-in). Specs reuse it via
`browser.newContext({ storageState: authFile('admin') })`.

## CI

`.github/workflows/ci.yml`: fast lane (`lint check-types test build`) on every push/PR, an integration
lane (Testcontainers), a hermetic e2e lane (mock mode, cached browsers), and a live e2e lane
(manual/`main`). Node 22, pnpm 10, `fetch-depth: 0` for Turbo filtering.

## Gotchas

- Playwright specs (`e2e/*.spec.ts`) are excluded from Vitest's include (they'd fail under Vitest) and
  from `astro check`; Playwright transpiles them itself.
- API `vitest.config.ts` is kept out of `tsconfig.json` `include` (its vite/rollup types conflict under
  the NestJS classic resolver); test files under `src` are still type-checked by `tsc`.
- The e2e mock layer is `.mjs` so the `--import` SSR preload loads it without a build step.
- `playwright/.auth/`, `playwright-report/`, `test-results/`, `coverage/` are git-ignored (auth state
  carries live session cookies — never commit it).
