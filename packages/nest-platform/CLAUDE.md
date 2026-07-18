# CLAUDE.md — @TheY2T/tmr-nest-platform

The cross-cutting **`PlatformModule`** (ADR 0009) — one import in `apps/api`'s `AppModule` that wires the
three platform pillars. Dual ESM+CJS build (tsup). See root `CLAUDE.md`.

## What it wires (so features don't)

- **Errors (ADR 0007):** `problem-details.filter.ts` — a global exception filter that turns framework-free
  `DomainError`s (from `@TheY2T/tmr-errors`) into **RFC 9457 problem+json** with a stable `code` + `traceId`.
- **Observability (ADR 0008):** binds the log/trace/context **ports** (`@TheY2T/tmr-observability`) that
  use-cases inject (`LOGGER`/`TRACER`/`REQUEST_CONTEXT`). OTEL is preloaded via `--require` at the app
  level; the domain stays OTEL-free.
- One `index.ts` re-exports `PlatformModule` + the filter.

## Rules

- **A feature never re-wires errors/logging/tracing** — importing `PlatformModule` once is enough. Throw
  `DomainError`s and inject the observability ports; the SDKs are never touched in domain/application.
- Keep this package thin and framework-boundary-only. Domain error taxonomy lives in `@TheY2T/tmr-errors`;
  the port abstractions live in `@TheY2T/tmr-observability` — this package only *binds* them into Nest.
- Because it's consumed by NestJS (CJS), keep the **dual ESM+CJS** output (don't make it CJS-only — see the
  root CLAUDE.md gotcha).

See `.claude/rules/api-hexagonal.md` for how features consume this, and `docs/features/error-handling.md`
+ `docs/features/observability.md`.
