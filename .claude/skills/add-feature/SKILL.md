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
(bind `{ provide: XPort, useClass: DrizzleX }`). Gate routes with `@RequireFlagsEnabled`. Mirror
`src/health/`. Add tables to `infrastructure/database/schema.ts` and run `db:generate`.

## 4. Frontend (`apps/web/src/`)
Add a route in `pages/`, islands in `components/` (one island root per interactive unit; keep
context-dependent shadcn together). Read the flag from `Astro.locals.flags` (SSR) and/or via
react-sdk in the island. Fetch the API using the typed contract.

## 5. Docs (Definition of Done)
Copy `docs/features/_template.md` → `docs/features/<feature>.md`. Add an ADR in `docs/adr/` if a
significant decision was made. Update Mermaid diagrams if structure changed. Enrich `CLAUDE.md` if a
new convention/gotcha emerged.

## 6. Verify
`pnpm build && pnpm lint && pnpm check-types && pnpm test`, then drive the flow end-to-end
(flag off → on) with the stack up.
