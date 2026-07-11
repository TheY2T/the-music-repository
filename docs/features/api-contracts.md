# Feature: API contracts (spec-first TypeSpec → OpenAPI → Zod)

- **Phase:** P · **Status:** shipped
- **ADR:** [0006](../adr/0006-spec-first-typespec.md)

## Source of truth

`packages/api-spec/main.tsp` (TypeSpec). Paths and models are declared **only** here.

## Workflow

1. Edit `main.tsp` (add an operation/model).
2. `pnpm spec:generate` → recompiles `openapi.json` and regenerates `@TheY2T/tmr-contracts` Zod DTOs.
3. Use the generated schema in NestJS: `class XDto extends createZodDto(GeneratedSchema) {}` (presentation
   layer only — map to domain types in the use-case).
4. `pnpm --filter @TheY2T/tmr-api-spec lint-spec` (Redocly) and commit the regenerated artifacts.

## CI guarantees

- **Valid** — `redocly lint` (config `packages/api-spec/redocly.yaml`).
- **No drift** — regenerate and `git diff --exit-code` (generation is deterministic/idempotent).
- **No breaking changes** — `oasdiff` gate on PRs (base vs PR `openapi.json`).

## Notes / follow-ups

- FE currently consumes the generated contract **types**; a dedicated `@TheY2T/tmr-api-client`
  (Orval TanStack Query hooks) lands in Phase 1.
- Response validation (`@ZodResponse`) and request DTOs (`createZodDto`) are exercised on the first
  Phase-1 POST endpoints.
