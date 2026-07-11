---
name: add-endpoint
description: Add a spec-first API endpoint to The Music Repository — TypeSpec contract → regenerate DTOs → hexagonal NestJS use-case → domain errors → verify trace/log/problem+json. Use when adding or changing an HTTP endpoint on apps/api.
---

# add-endpoint

Spec-first, platform-consistent endpoint workflow. Contract first; docs + flag are Definition of Done.

## 1. Contract (TypeSpec — the source of truth)
Edit `packages/api-spec/main.tsp`: add the operation (`@route`, `@get`/`@post`, models). Reference
`ProblemDetails` for error responses. Paths live ONLY here.

## 2. Regenerate
`pnpm spec:generate` → recompiles `openapi.json` + regenerates `@TheY2T/tmr-contracts` Zod DTOs.
`pnpm --filter @TheY2T/tmr-api-spec lint-spec`. Commit the regenerated artifacts.

## 3. Feature flag
Add a key to `@TheY2T/tmr-flags` + `flags/flags.json`; gate the route with `@RequireFlagsEnabled`.

## 4. Backend (hexagonal — apps/api/src/<feature>/)
- `dto/` — `class XDto extends createZodDto(GeneratedSchema) {}` (presentation only).
- `domain/` — entities + `errors/*.error.ts` extending a category from `@TheY2T/tmr-errors` (framework-free).
- `application/` — `ports/*.port.ts` (abstract classes) + `*.use-case.ts` (throws domain errors; may
  inject `LOGGER`/`TRACER`/`REQUEST_CONTEXT` ports for logging/tracing — never the SDKs).
- `infrastructure/` — Drizzle adapter + mapper; **outbound** errors re-categorised (5xx→502, timeout→504).
- `*.controller.ts` — thin: DTO in → use-case → response DTO out. Map DTO ↔ domain in the use-case.
- `*.module.ts` — bind `{ provide: XPort, useClass: DrizzleX }`.

No new wiring for errors/logging/tracing — `PlatformModule` (already in AppModule) handles it.

## 5. Docs
`docs/features/<feature>.md` (+ each new error `code`); ADR if a significant decision; update Mermaid
if structure changed; enrich CLAUDE.md on a new gotcha.

## 6. Verify
`pnpm build lint check-types`; `pnpm infra:up` + `pnpm obs:up`; drive the endpoint and confirm: success
path returns the contract shape; error path returns `application/problem+json` with a `code` + `traceId`
that matches the error log line and an ERROR span in Grafana/Tempo.
