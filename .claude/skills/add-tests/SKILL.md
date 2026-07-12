---
name: add-tests
description: Write unit, component, integration, and E2E tests for a feature in The Music Repository (Vitest + Testing Library + Testcontainers + Playwright). Use whenever adding or changing a use-case, island, shared package, endpoint, or user flow — tests are Definition of Done. See docs/features/testing.md + ADR 0020.
---

# add-tests

Tests are part of the Definition of Done. Pick the layer(s) that match what you changed and colocate
tests with the source. Runner config comes from `@TheY2T/tmr-config-vitest` — never hand-roll it.

## Which layer?

| You changed… | Write a… | File | Tier |
|---|---|---|---|
| A shared package's logic | unit test | `packages/<pkg>/src/*.test.ts` | `pnpm test` |
| A web pure lib / middleware / api-client | unit test | `apps/web/src/**/*.test.ts` | `pnpm test` |
| A React island | component test | `apps/web/src/components/<C>.test.tsx` | `pnpm test` |
| An API use-case / domain rule | unit test (mock ports) | `apps/api/src/**/*.test.ts` | `pnpm test` |
| A new endpoint / error mapping | HTTP test (Supertest) | `apps/api/src/**/*.test.ts` | `pnpm test` |
| A Drizzle adapter / repository | integration test | `apps/api/src/**/*.integration.test.ts` | `pnpm test:integration` |
| A user-facing flow | E2E spec | `apps/web/e2e/*.spec.ts` | `pnpm test:e2e` |

## 1. New testable package or app needs config

Add `vitest.config.ts` (extending the shared presets) + the devDeps
(`@TheY2T/tmr-config-vitest`, `@vitest/coverage-v8`, `vitest` — all `catalog:`/`workspace:*`):

```ts
import { nodePreset } from "@TheY2T/tmr-config-vitest";      // reactPreset for DOM/islands
import { defineConfig } from "vitest/config";
export default defineConfig(nodePreset());
```

## 2. API use-case — mock the ports (no Nest DI)

```ts
const search: CatalogueSearch = { search: vi.fn().mockResolvedValue(result), indexAll: vi.fn() };
const result = await new SearchCatalogueUseCase(search).execute(query, viewerRank);
expect(search.search).toHaveBeenCalledWith(query);
```
Template: `apps/api/src/catalogue/application/use-cases/search-catalogue.use-case.test.ts`.

## 3. API endpoint / errors — assert problem+json

Boot a `Test.createTestingModule` with `{ provide: LOGGER, useValue: fakeLogger }` +
`{ provide: APP_FILTER, useClass: ProblemDetailsExceptionFilter }` and a controller; assert the
DomainError → 404/422 `application/problem+json` with a stable `code`.
Template: `apps/api/src/platform-problem-details.test.ts`.

## 4. API adapter — Testcontainers Postgres

```ts
const container = await new PostgreSqlContainer("postgres:16-alpine").start();
const db = drizzle(postgres(container.getConnectionUri(), { max: 1 }), { schema });
await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
```
Name it `*.integration.test.ts` (runs only in `pnpm test:integration`; needs Docker/podman).
Template: `apps/api/src/health/infrastructure/drizzle-datastore-health-check.integration.test.ts`.

## 5. React island — i18n-by-prop

```tsx
render(<LanguageSwitcher locale="en" />);       // pass locale as a prop
expect(screen.getByText("中文")).toBeInTheDocument();
```
Render the island **root** (React context doesn't cross islands). happy-dom is default; add
`// @vitest-environment jsdom` at the top only if you hit a missing DOM API.
Template: `apps/web/src/components/LanguageSwitcher.test.tsx`. (`.astro` components are covered by E2E,
not unit tests — ADR 0020.)

## 6. E2E flow — Playwright

Add `apps/web/e2e/<flow>.spec.ts` importing `{ expect, test } from "./fixtures"`. Prefer
`getByRole`/`getByLabel`; no manual sleeps. For a11y, `new AxeBuilder({ page }).analyze()` after
`waitUntil: "networkidle"`. Auth-gated flows: `browser.newContext({ storageState: authFile("admin") })`.

If the flow calls a backend service not yet mocked, add it: name in `SERVICE_NAMES`
(`e2e/mocks/data.mjs`) → MSW handler (`e2e/msw/handlers.mjs`) → browser `page.route`
(`e2e/mocks/browser-routes.ts`). E2E runs mocked by default; `TMR_E2E_MODE=live` hits the real stack,
`TMR_E2E_MOCK_SERVICES=<subset>` mocks some and passes the rest through.

## 7. Run + verify

```bash
pnpm --filter @TheY2T/tmr-<pkg> exec vitest run   # the package you touched
pnpm test                                         # whole workspace (fast)
pnpm test:integration                             # if you added a Testcontainers test
pnpm test:e2e                                      # if you added an E2E spec
```
Clean up any Playwright artifacts (`test-results/`, `playwright-report/`, `e2e/.auth/`) — they're
git-ignored. Coverage: `pnpm test:coverage`.
