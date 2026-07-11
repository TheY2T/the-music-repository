# CLAUDE.md — apps/api (NestJS)

NestJS backend, **clean/hexagonal per feature**. See root `CLAUDE.md` for repo-wide rules.

## Feature module template

Each feature is a folder (e.g. `health/`, and in Phase 1 `catalogue/`, `identity/`):

```
<feature>/
  domain/            # entities, value objects — POJOs, ZERO framework/db imports
  application/
    ports/           # abstract classes = DI tokens (the capability the use-case needs)
    *.use-case.ts    # orchestration, depends only on ports + domain
  infrastructure/    # adapters implementing ports (Drizzle repos + mappers, external APIs)
  dto/               # request/response DTOs (Phase 1: nestjs-zod from @TheY2T/tmr-contracts)
  *.controller.ts    # presentation
  *.module.ts        # binds port → adapter: { provide: <PortClass>, useClass: <Adapter> }
```

**Port naming (ADR 0012):** ports are named for the **domain capability** the core needs — never the
technology, **no `Port` suffix** (e.g. `CatalogueSearch`, `MediaLibrary`, `ContentRepository`,
`DatastoreHealthCheck`). Adapters are `<Technology><Capability>` (e.g. `MeilisearchCatalogueSearch`,
`S3MediaLibrary`, `DrizzleDatastoreHealthCheck`).

Reference implementations: `src/health/` (`DatastoreHealthCheck` ← `DrizzleDatastoreHealthCheck`) and
**`src/catalogue/`** (the full Phase-1 feature — `ContentRepository`/`CatalogueSearch`/`MediaLibrary`
behind ports; Drizzle + Meilisearch + S3/MinIO adapters; spec-first DTOs; a domain error → problem+json).
Copy `catalogue/` when adding a feature; follow the `add-endpoint` skill.

**Gotchas learned in catalogue:** `meilisearch` 0.59 is exports-only with class `Meilisearch` — needs a
`paths` mapping in `tsconfig.json`. The FE serializes unselected array facets as `genre=` (empty string);
the controller drops empties. MinIO presigned URLs use `S3_PUBLIC_ENDPOINT` so the browser can reach them.

## Data (Drizzle)

- Schema: `src/infrastructure/database/schema.ts`. Client: `DatabaseModule` (token `DATABASE`).
- Only `infrastructure/` adapters may import Drizzle. Map ORM rows ↔ domain in a mapper.
- `pnpm --filter @TheY2T/tmr-api db:generate` after schema changes; migrations live in `drizzle/`.

## Feature flags

`FeatureFlagsModule` registers OpenFeature + flagd with a per-request `contextFactory`. Gate routes
with `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })`; evaluate imperatively via an
injected `@OpenFeatureClient()` client. Keys come from `@TheY2T/tmr-flags`. See `src/flags/`.

## Auth & RBAC (Slice 2, ADR 0013)

Better Auth lives in `src/auth/` and owns `/api/auth/*`. Key rules:

- **`bodyParser: false`** on `NestFactory.create` is **mandatory** (`main.ts`) — the @thallesp module
  re-adds body parsing for non-auth routes. CORS is set once in `main.ts` from `TRUSTED_ORIGINS`
  (exact origins + `credentials: true`); the module's own CORS is disabled.
- **Global auth guard is disabled** (`disableGlobalAuthGuard: true`) so the public catalogue stays
  anonymous. Protect a route by opting in: `@RequireAuth()` or `@RequirePermissions({ content: ['publish'] })`
  from `src/auth/require-permissions.decorator.ts` (wrap the library's `AuthGuard` + `@UserHasPermission`).
- **RBAC** is permission-based in `src/auth/access-control.ts` (roles `admin`/`editor`/`learner`).
- **Read the acting user via the `CurrentUser` port** (`application/current-user.ts`), implemented by
  the request-scoped `BetterAuthCurrentUser` adapter. **Never import `better-auth` in domain/application.**
- **Tables** are hand-written in `src/auth/auth-schema.ts` (re-exported from `database/schema.ts`) so
  **drizzle-kit** owns migrations — do **not** run `better-auth migrate`. Regenerate with `db:generate`.
- **Seed dev users:** `pnpm --filter @TheY2T/tmr-api db:seed:auth` → `admin|editor|learner@local.dev` /
  `password123` (**local only**).
- **ESM interop:** `better-auth` + `@thallesp/nestjs-better-auth` are ESM-only; Node 22 `require(esm)`
  loads them from the CJS build, and classic-`Node` tsc resolves their types (verified). No `paths`
  mapping needed (unlike meilisearch).

## Admin CMS (Slice 2b, `src/authoring/`)

Spec-first, RBAC-gated authoring built on the catalogue feature. Follow it as the template for
write-side features:

- **Ports:** `ContentAuthoring` (writes + admin list) and `TaxonomyCatalog`, bound to
  `DrizzleContentAuthoring` / `DrizzleTaxonomyCatalog`. Reads reuse the catalogue `ContentRepository`;
  the module imports `CatalogueModule` for `MediaLibrary` + `CatalogueReindexService`.
- **Reindex-on-write:** update/publish/unpublish/delete call `CatalogueReindexService.reindex()`.
- **DTOs:** `createZodDto(...)` over generated `@TheY2T/tmr-contracts` body schemas → the global
  `ZodValidationPipe` yields **422 problem+json with `errors[]`** on invalid bodies.
- **RBAC:** every route uses `@RequirePermissions({ resource: [actions] })` (editor can't delete —
  `content:delete` is admin-only).
- **Media upload = presigned PUT:** `MediaLibrary.presignPutUrl`; browser PUTs directly to MinIO
  (default CORS is permissive; `ensureBucket` also does a **best-effort** `PutBucketCors`, swallowed
  when the storage returns `NotImplemented` so it never breaks bucket setup / seeding).
- **List responses wrap in `{ items }`** to match the contract; `POST .../publish` sets `@HttpCode(200)`
  (Nest defaults POST to 201).

## Config

Env is validated at boot by Zod (`src/config/env.ts`) via `@nestjs/config`. Add new vars there.
Auth vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS` (dev defaults are local-only).

## Commands

`pnpm --filter @TheY2T/tmr-api dev|build|check-types|lint|test|db:generate|db:migrate`
