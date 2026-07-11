# CLAUDE.md — apps/api (NestJS)

NestJS backend, **clean/hexagonal per feature**. See root `CLAUDE.md` for repo-wide rules.

## Feature module template

Each feature is a folder (e.g. `health/`, and in Phase 1 `catalogue/`, `identity/`):

```
<feature>/
  domain/            # entities, value objects — POJOs, ZERO framework/db imports
  application/
    ports/           # abstract classes = DI tokens (what the use-case needs)
    *.use-case.ts    # orchestration, depends only on ports + domain
  infrastructure/    # adapters implementing ports (Drizzle repos + mappers, external APIs)
  dto/               # request/response DTOs (Phase 1: nestjs-zod from @TheY2T/tmr-contracts)
  *.controller.ts    # presentation
  *.module.ts        # binds port → adapter: { provide: XPort, useClass: DrizzleX }
```

Reference implementation: `src/health/` (port `DatabaseHealthPort` ← adapter
`DrizzleDatabaseHealthAdapter`, wired in `health.module.ts`).

## Data (Drizzle)

- Schema: `src/infrastructure/database/schema.ts`. Client: `DatabaseModule` (token `DATABASE`).
- Only `infrastructure/` adapters may import Drizzle. Map ORM rows ↔ domain in a mapper.
- `pnpm --filter @TheY2T/tmr-api db:generate` after schema changes; migrations live in `drizzle/`.

## Feature flags

`FeatureFlagsModule` registers OpenFeature + flagd with a per-request `contextFactory`. Gate routes
with `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })`; evaluate imperatively via an
injected `@OpenFeatureClient()` client. Keys come from `@TheY2T/tmr-flags`. See `src/flags/`.

## Config

Env is validated at boot by Zod (`src/config/env.ts`) via `@nestjs/config`. Add new vars there.

## Commands

`pnpm --filter @TheY2T/tmr-api dev|build|check-types|lint|test|db:generate|db:migrate`
