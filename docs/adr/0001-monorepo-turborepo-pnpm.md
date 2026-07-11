# ADR 0001 — Monorepo: Turborepo + pnpm workspaces + catalogs

- **Status:** Accepted
- **Context:** Frontend (Astro) and backend (NestJS) share types and flag definitions and must
  version dependencies consistently.
- **Decision:** Turborepo 2.x task runner + pnpm workspaces, with **pnpm catalogs** as the single
  source of dependency versions (`pnpm-workspace.yaml`). Layout: `apps/{web,api}`,
  `packages/{contracts,flags,config-*}`. All packages scoped `@TheY2T/tmr-*`.
- **Consequences:** One place to bump versions; shared contracts/flags packages; `turbo.json` uses
  `tasks` (not `pipeline`). Internal packages compile to CommonJS for cross-runtime consumption.
