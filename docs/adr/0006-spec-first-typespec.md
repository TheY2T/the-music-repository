# ADR 0006 — Spec-first APIs: TypeSpec → OpenAPI → Orval/Zod

- **Status:** Accepted
- **Context:** We want one authoritative HTTP contract that drives both the backend and the frontend,
  with CI governance. Considered: TypeSpec design-first, Zod-first (generate OpenAPI), ts-rest.
- **Decision:** **TypeSpec** (`packages/api-spec`) is the source of truth → compiles to committed
  **OpenAPI 3.1** (`openapi.json`). From that spec: **Orval** generates backend **Zod DTOs** into
  `@TheY2T/tmr-contracts` (used by NestJS via nestjs-zod `createZodDto`), and (Phase 1) the FE client.
  Paths are declared **only** in TypeSpec — never in NestJS decorators.
- **Consequences:** Single contract; drift is impossible if CI enforces it. `@TheY2T/tmr-contracts`
  is now **generated** (not hand-written). Business-rule validation lives in the **domain** (not the
  transport DTO), so generated DTOs losing Zod refinements is a non-issue.
- **CI gates:** `redocly lint` (config: `packages/api-spec/redocly.yaml`) → drift check
  (`pnpm spec:generate` then `git diff --exit-code`) → `oasdiff` breaking-change gate on PRs.
  Generation is deterministic (verified byte-identical on re-run).
- **Follow-up:** a dedicated FE `@TheY2T/tmr-api-client` (Orval TanStack Query hooks) is added in
  Phase 1 when the app adopts TanStack Query; for now the FE consumes the generated contract types.
