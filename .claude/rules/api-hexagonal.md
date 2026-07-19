---
paths:
  - "apps/api/src/**"
---

# apps/api — hexagonal feature rules

Every feature is a folder with strict layering: `domain ← application ← infrastructure/presentation`.
Copy `src/catalogue/` (the full reference feature) when adding one; follow the **`add-endpoint`** skill.

```
<feature>/
  domain/            # entities, value objects — POJOs, ZERO framework/db imports
  application/
    ports/           # abstract classes = DI tokens (the capability the use-case needs)
    *.use-case.ts    # orchestration; depends only on ports + domain; throws DomainErrors
  infrastructure/    # adapters implementing ports (Drizzle repos + mappers, external APIs)
  dto/               # createZodDto(...) over @TheY2T/tmr-contracts schemas (presentation only)
  *.controller.ts    # thin: DTO in → use-case → DTO out; map DTO ↔ domain in the use-case
  *.module.ts        # binds { provide: <PortClass>, useClass: <Adapter> }
```

## Non-negotiables

- **Port naming (ADR 0012):** name ports for the **domain capability**, never the tech, **no `Port`
  suffix** — `ContentRepository`, `CatalogueSearch`, `MediaLibrary`, `DatastoreHealthCheck`. Adapters are
  `<Technology><Capability>` — `DrizzleContentRepository`, `MeilisearchCatalogueSearch`, `S3MediaLibrary`.
- **Use-cases depend on ports, never Drizzle.** Only `infrastructure/` adapters import Drizzle; map ORM
  rows ↔ domain in a mapper. Schema: `src/infrastructure/database/schema.ts`; client token `DATABASE`.
- **Never import `better-auth` in domain/application** — read the acting user via the `CurrentUser` port
  (`application/current-user.ts`), implemented by request-scoped `BetterAuthCurrentUser`.
- **Errors/logging/tracing need no wiring** — `PlatformModule` (in `AppModule`) returns RFC 9457
  problem+json (`code` + `traceId`) and provides `LOGGER`/`TRACER`/`REQUEST_CONTEXT` ports. Throw
  framework-free `DomainError`s from `@TheY2T/tmr-errors`; **outbound** errors re-categorise in the
  adapter (5xx→502, timeout→504). Never inject the OTEL/pino SDKs — inject the ports.

## Auth / RBAC (ADR 0013, `src/auth/`)

- Global auth guard is **disabled** so the catalogue stays anonymous; opt in per route with
  `@RequireAuth()` / `@RequirePermissions({ resource: ['action'] })` (from `require-permissions.decorator.ts`).
- For public routes that want the viewer when present, use `ResolveOptionalAuth()` (never rejects anon) —
  plain `@RequireAuth()` can't populate `CurrentUser` on an otherwise-public route.
- Auth tables are hand-written in `src/auth/auth-schema.ts`; **drizzle-kit owns migrations** — never run
  `better-auth migrate`. `bodyParser: false` in `main.ts` is mandatory.

## Feature flags & config

- Gate routes with `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })` (keys from
  `@TheY2T/tmr-flags`). **Method-level** for deferred features (class-level drops route mapping). Flags are
  **DB-backed** (ADR 0035) — a new key goes live on `db:seed`; existing flags toggle per-env in
  `/admin/feature-flags` with no redeploy (no flagd). Follow **`manage-flags`**.
- Env is Zod-validated at boot in `src/config/env.ts` — add new vars there (`APP_ENV` names the flag env).

## Testing (Definition of Done — `add-tests`)

- **Unit** (`pnpm --filter @TheY2T/tmr-api test`, no Docker): use-cases with **mocked ports** (plain
  objects, no Nest DI), pure domain, and HTTP error-mapping over Supertest (`src/**/*.test.ts`).
- **Integration** (`test:integration`, needs Docker): adapters against real Postgres via Testcontainers
  + Drizzle migrations (`*.integration.test.ts`).

See `apps/api/CLAUDE.md` for feature-specific detail (CMS, collections, monetization, classrooms).
