---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.integration.test.ts"
  - "**/e2e/**"
---

# Testing (ADR 0020, `docs/features/testing.md`) — tests are Definition of Done

Ship tests with the code. Shared runner config from `@TheY2T/tmr-config-vitest`. Follow the **`add-tests`**
skill.

## Tiers

- **Unit** (Vitest, `pnpm test` — no Docker): logic/use-cases. **Mock ports, never Drizzle** (plain
  objects, no Nest DI). Pure domain rules. `src/**/*.test.ts`.
- **Component** (Vitest + happy-dom): islands/UI via `@testing-library/react` — **i18n-by-prop** (pass
  `locale` as a prop), render the island **root**. `.astro` components are covered by E2E, not unit tests.
- **Integration** (api, `pnpm test:integration` — needs Docker): adapters/repos against real Postgres via
  **Testcontainers** + Drizzle migrations. Name `*.integration.test.ts`.
- **E2E** (Playwright, `e2e/*.spec.ts`): runs against the production build. **Mock mode** (default) uses an
  MSW SSR preload + browser routes (flags fall back to defaults); **live mode** (`TMR_E2E_MODE=live`) hits
  the real stack. `TMR_E2E_MOCK_SERVICES=all|<subset>`. Auth via per-role `storageState`
  (`e2e/auth.setup.ts`).

## Gotchas

- Island/hook components that hit the duplicate-React optimizer (Pixi, hooks-with-`smplr`) **can't** be
  unit-tested under `getViteConfig` — cover them with a Playwright E2E smoke instead.
- E2E specs are excluded from Vitest + `astro check`. Clean up `test-results/`, `playwright-report/`,
  `e2e/.auth/` after runs (git-ignored).
- Run root `pnpm test` / `pnpm test:integration` / `pnpm test:e2e` (or filter per package).
