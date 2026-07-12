---
name: add-feature
description: Scaffold a new feature across the monorepo (NestJS hexagonal module + Astro route + shared contract + feature flag + docs) following The Music Repository conventions. Use when adding a new backend feature, endpoint, or user-facing capability.
---

# add-feature

Playbook for adding a feature consistently. Follow every step — docs and flags are Definition of Done.

## 1. Contract first (`packages/contracts`)
Add/extend the Zod schema + inferred type in `src/`, re-export from `src/index.ts`. This is the single
FE/BE source of truth. Build it (`pnpm --filter @TheY2T/tmr-contracts build`).

## 2. Feature flag (`packages/flags` + `flags/flags.json`)
Add a key to `FlagKeys` (`<domain>.<capability>`) and a default to `FlagDefaults`. Define the flag in
`flags/flags.json` (start `defaultVariant: "off"`, target internal roles first).

## 3. Backend module (`apps/api/src/<feature>/`) — hexagonal
Create `domain/` (POJO entities), `application/ports/*.port.ts` (abstract classes) + `*.use-case.ts`,
`infrastructure/*.adapter.ts` (Drizzle repo + mapper), `dto/`, `*.controller.ts`, `*.module.ts`
(bind `{ provide: <PortClass>, useClass: <Adapter> }`). Gate routes with `@RequireFlagsEnabled`. Mirror
`src/catalogue/`. Add tables to `infrastructure/database/schema.ts` and run `db:generate`.

**Name ports for the domain capability, not the tech (ADR 0012):** e.g. port `CatalogueSearch` /
`MediaLibrary` (no `Port` suffix), adapter `MeilisearchCatalogueSearch` / `S3MediaLibrary`.

## 4. Frontend (`apps/web/src/`)
Add a route in `pages/`, islands in `components/` (one island root per interactive unit; keep
context-dependent shadcn together). **Build UI from `@TheY2T/tmr-ui`** — compose atoms/molecules
(`Button`, `Card`, `Field`, `Input`, `Badge`, `CardGrid`, `PageHeader`, …); wrap the page in
`PageShell` (`@TheY2T/tmr-ui/astro/PageShell.astro`) inside `BaseLayout`; no bespoke raw-Tailwind
chrome. Need a new shared component/token? Use the **`add-ui-component`** skill (ADR 0018). Read the
flag from `Astro.locals.flags` (SSR) and/or via react-sdk in the island. Fetch the API using the
typed contract. Localize strings via `t(locale, key)` (**`add-translations`**) and pass them into
library components as props.

## 5. Docs (Definition of Done)
Copy `docs/features/_template.md` → `docs/features/<feature>.md`. Add an ADR in `docs/adr/` if a
significant decision was made. Update Mermaid diagrams if structure changed. Enrich `CLAUDE.md` if a
new convention/gotcha emerged.

## 6. Verify
`pnpm build && pnpm lint && pnpm check-types && pnpm test`, then drive the flow end-to-end
(flag off → on) with the stack up.

## Write tests (Definition of Done — `add-tests` skill)

Tests ship with the feature, across every layer you touched:
- **API:** unit-test use-cases (mock ports) + domain rules; assert problem+json for error paths;
  `*.integration.test.ts` (Testcontainers) for new adapters.
- **Web:** unit-test new `lib/*` + api-client wrappers; component-test islands via `@testing-library/react`
  (pass `locale` as a prop, render the island root).
- **E2E:** add an `apps/web/e2e/*.spec.ts` for the user-facing flow (mock mode by default; add the
  service to the MSW registry if it isn't mocked yet).
- Run `pnpm test` (+ `test:integration` / `test:e2e`). Full guide: `docs/features/testing.md`, ADR 0020.
