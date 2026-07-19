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

## Content authoring (catalogue, collections, scores)

All authored as **files → `*:build` → committed seed bundle → `db:seed`**. Full workflow is the
**`author-content`** skill (+ `.claude/rules/content-authoring.md`); scores have the **`add-score`** skill.
- **Catalogue** — `src/infrastructure/database/content/<slug>.md` → `content:build` → `seed-content.ts`.
  Rich `body_mdx` + `details` JSONB + curated `related` + a fenced ```embeds block (preconfigured tools,
  spec-first `ContentEmbed`; **`embed-tool`** skill, ADR 0028). Era = Meili facet from `details.era` (no SQL
  taxonomy). `docs/features/{catalogue,content-embeds}.md`.
- **Collections** (`src/collections/`, ADR 0023) — `content/collections/<slug>.md` → `collections:build`.
  `Collection.itemSlugs` MUST stay **flattened, section-ordered** (progress reads it). Ports:
  `CollectionRepository`/`CollectionBookmarks`/`CollectionRatings`/`CollectionSearchIndex` + thin
  `LearnerProgress` (reads `content_progress`, avoids a `ProgressModule` cycle); private user collections
  never indexed; ownership enforced in use-cases (403). `docs/features/collections.md`.
- **Scores** (alphaTex, ADR 0027) — `content/scores/<slug>.alphatex` + `.meta.json` → `scores:build`.
  Gotchas + licensing in `.claude/rules/scores.md`; `scores:validate` gates structure; `scores:migrate`
  converts legacy MusicXML losslessly. `docs/features/scores.md`.

## Feature flags (ADR 0035, `src/feature-flags/`)

**DB-backed** (flagd removed). `FeatureFlagsModule` registers OpenFeature with a custom
`TmrFlagProvider` (`@TheY2T/tmr-flags-eval`) that resolves flags **in-process from Postgres** for `APP_ENV`
(set on `onApplicationBootstrap` via `InProcessSnapshotSource` + the `FeatureFlagCatalogue` read port).
Gate routes with `@RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.X }] })` (method-level); evaluate
imperatively via an injected `@OpenFeatureClient()`. Keys come from `@TheY2T/tmr-flags` (type source + DB
seed via `seed-feature-flags.ts` + fallback). Hexagonal write side: `FeatureFlagAuthoring` /
`FlagEnvironmentRegistry` ports → Drizzle adapters → `/admin/feature-flags` CRUD (RBAC `featureFlags`
resource, admin-only). Public read: `GET /feature-flags/snapshot/:env` (ETag/304) feeds the web provider.
Follow **`manage-flags`**.

## Auth & RBAC (Slice 2, ADR 0013)

Better Auth lives in `src/auth/` and owns `/api/auth/*`. Key rules:

- **`bodyParser: false`** on `NestFactory.create` is **mandatory** (`main.ts`) — the @thallesp module
  re-adds body parsing for non-auth routes. CORS is set once in `main.ts` from `TRUSTED_ORIGINS`
  (exact origins + `credentials: true`); the module's own CORS is disabled.
- **Global auth guard is disabled** (`disableGlobalAuthGuard: true`) so the public catalogue stays
  anonymous. Protect a route by opting in: `@RequireAuth()` or `@RequirePermissions({ content: ['publish'] })`
  from `src/auth/require-permissions.decorator.ts` (wrap the library's `AuthGuard` + `@UserHasPermission`).
- **RBAC** is permission-based in `src/auth/access-control.ts` (roles `admin`/`editor`/`teacher`/`learner`).
  The `teacher` role holds `classroom:create` (admins too) — `POST /me/classrooms` is
  `@RequirePermissions({ classroom: ['create'] })`, so only teachers/admins create classrooms.
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

## Localization (ADR 0034, `src/i18n/`)

DB-backed UI strings served to `apps/web` + an admin CMS write side (`docs/features/i18n.md`). Previously
the API had **no** i18n responsibility — it now owns the string catalogue.
- **Ports:** `UiMessageCatalogue` (assemble published catalogue + versions; in-memory cache keyed by the
  per-locale version so the hot path never full-scans) and `UiMessageAuthoring` (draft CRUD, soft
  delete/restore, publish, revisions), bound to `DrizzleUiMessage*`.
- **Public read:** `GET /i18n/version` + `GET /i18n/catalogue/:locale` (ETag = version, conditional GET →
  304), ungated. **Admin write:** `/admin/i18n/*`, `@RequirePermissions({ content: […] })` + method-level
  `@RequireFlagsEnabled(FlagKeys.LocaleStrings)`.
- **Seed:** `seed-i18n.ts` upserts `en.json`/`zh-Hans.json` as published `seeded` rows (idempotent) + the
  `locales` registry rows. Only published, non-deleted rows are served; publishing bumps `i18n_versions`.
- **Locale registry + import (`locales` table):** `LocaleRegistry` port (list/create/ensure) backed by
  `DrizzleLocaleRegistry`; `GET /i18n/locales` (public), `POST /admin/i18n/locales` (create),
  `POST /admin/i18n/import` (bulk key→value upsert as drafts; auto-registers a new locale). The registry
  is a **superset** of the routing `LOCALES` — a new locale is translatable/servable via the DB but URL
  routing + the switcher still need a code deploy.
- **Content translations (Phase 2, `src/translations/`):** per-locale overlay of **content** fields
  (`entity_translations`). `ContentTranslations` overlay port (exported; injected into the **catalogue**,
  **collections** (via `CollectionDetailAssembler`), and **help** read paths to overlay text fields when a
  read carries `?locale=`, falling back to base) + `EntityTranslationAuthoring` write side
  (`/admin/translations`, draft→publish→revisions + soft delete). Overlays applied by pure
  `apply*Overlay` domain helpers. Any read module that overlays imports `TranslationsModule`. No
  Catalogue↔Translations cycle: translation publish does **not** reindex, so Meilisearch search stays
  base-locale until the per-locale index slice lands.

## Monetization & Phase-6 (DEFERRED — flags OFF, ships free/public-domain)

`monetization.premium` defaults **OFF** ⇒ the whole entitlement system is dormant (`resolveViewerRank` →
Infinity, nothing locks) and the `@RequireFlagsEnabled(Premium)` routes 404. Turn it on only once premium
content exists. The web-only `monetization.messaging` flag separately gates premium copy/CTAs
(`apps/web/CLAUDE.md`). Each area is a write-side feature following the CMS template above; full detail in
its feature doc — read that before editing:

- **Entitlements / subscription** (`src/entitlements/`, ADR 0015) — `Entitlements` port ←
  `DrizzleEntitlements`; tiered locked-preview (`tier` `premium`/`pro`, `TIER_RANK`). `docs/features/monetization.md`.
- **Billing** (`src/billing/`, ADR 0016) — `CheckoutGateway` port, mock by default / Stripe when keyed;
  `/me/checkout` + unauthenticated `/billing/webhook`. `docs/features/billing.md`.
- **Classrooms** (`src/classrooms/`, `education.classrooms`) — `docs/features/classrooms.md`.
- **Redeem codes + audit log** (`src/redemption/`) — `docs/features/redemption.md`.
- **Mail** (`src/mail/`) — `MailSender` port, `LogMailSender` (dev/CI) / `SmtpMailSender` when `SMTP_URL` set.

**Recurring gotchas across all of these:** gate deferred routes with **method-level**
`@RequireFlagsEnabled` (class-level drops route mapping); a new flag key goes live on `db:seed` (flags are
DB-backed — no flagd reload; `.claude/rules/flags.md`); read the viewer on public routes with
`ResolveOptionalAuth()` (never `@RequireAuth()`); Stripe signature verification needs raw bytes that
`bodyParser:false` doesn't capture.

## Config

Env is validated at boot by Zod (`src/config/env.ts`) via `@nestjs/config`. Add new vars there.
Auth vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS` (dev defaults are local-only).

## Testing (ADR 0020, `docs/features/testing.md`)

- **Unit tier** (`pnpm test` — no Docker, Vitest + `unplugin-swc`): test **use-cases by mocking their
  ports** (plain objects — no Nest DI), pure domain rules, and endpoint error mapping over HTTP
  (`@nestjs/testing` + Supertest through the `ProblemDetailsExceptionFilter` with a fake `LOGGER` —
  assert RFC 9457 problem+json). Files: `src/**/*.test.ts`. Templates: `catalogue/.../search-catalogue.use-case.test.ts`,
  `src/platform-problem-details.test.ts`.
- **Integration tier** (`pnpm test:integration` — needs Docker/podman): adapters/repositories against a
  real Postgres via **Testcontainers** + Drizzle migrations (`migrationsFolder: join(process.cwd(),
  'drizzle')`). Name files `*.integration.test.ts`. Template:
  `health/infrastructure/drizzle-datastore-health-check.integration.test.ts`.
- The mock adapters (billing `MockCheckoutGateway`, mail `LogMailSender`) are the CI-safe seams — tests
  never call Stripe/SMTP. Follow the **`add-tests`** skill.

## Commands

`pnpm --filter @TheY2T/tmr-api dev|build|check-types|lint|test|test:integration|db:generate|db:migrate`
