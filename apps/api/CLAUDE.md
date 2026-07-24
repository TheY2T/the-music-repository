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
`DatastoreHealthCheck`). Adapters are `<Technology><Capability>` (e.g. `PostgresCatalogueSearch`,
`PostgresMediaLibrary`, `DrizzleDatastoreHealthCheck`).

Reference implementations: `src/health/` (`DatastoreHealthCheck` ← `DrizzleDatastoreHealthCheck`) and
**`src/catalogue/`** (the full Phase-1 feature — `ContentRepository`/`CatalogueSearch`/`MediaLibrary`
behind ports; all Postgres-backed adapters (ADR 0048); spec-first DTOs; a domain error → problem+json).
Copy `catalogue/` when adding a feature; follow the `add-endpoint` skill.

**Gotchas learned in catalogue:** the FE serializes unselected array facets as `genre=` (empty string);
the controller drops empties. Search (`PostgresCatalogueSearch`/`PostgresCollectionSearch`) filters and
facets in memory over the published set (ADR 0048); the reindex services' `indexAll` is a no-op. Media
bytes live in `media_objects` and are served from `GET /media?key=…` (`PostgresMediaLibrary`).

## Data (Drizzle)

- Schema: `src/infrastructure/database/schema.ts`. Client: `DatabaseModule` (token `DATABASE`).
- Only `infrastructure/` adapters may import Drizzle. Map ORM rows ↔ domain in a mapper.
- `pnpm --filter @TheY2T/tmr-api db:generate` after schema changes; migrations live in `drizzle/`.

## Content authoring (catalogue, collections, scores)

All authored as **files → `*:build` → committed seed bundle → `db:seed`**. Full workflow is the
**`author-content`** skill (+ `.claude/rules/content-authoring.md`); scores have the **`add-score`** skill.
- **Catalogue** — `src/infrastructure/database/content/<slug>.md` → `content:build` → `seed-content.ts`.
  Rich `body_mdx` + `details` JSONB + curated `related` + a fenced ```embeds block (preconfigured tools,
  spec-first `ContentEmbed`; **`embed-tool`** skill, ADR 0028). Era = search facet from `details.era` (no
  SQL taxonomy). `docs/features/{catalogue,content-embeds}.md`.
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
  Includes `rate_limit` (Better Auth `rateLimit` with `storage: 'database'`).
- **Social sign-in (Google/Facebook, ADR 0050; Microsoft, ADR 0052; Apple, ADR 0054):** `socialProviders`
  in `better-auth.ts`, each registered only when its env credentials are set. Account linking is on
  (`trustedProviders: ['google']`). Apple's client secret is a self-refreshing ES256 JWT built by
  `create-apple-client-secret.ts` (`node:crypto`, no JWT lib) from `APPLE_CLIENT_ID`/`TEAM_ID`/`KEY_ID`/
  `PRIVATE_KEY`; set up per `docs/runbooks/apple-oauth-setup.md`.
- **OAuth callbacks are on the API domain** (`redirect_uri = ${BETTER_AUTH_URL}/api/auth/callback/<p>`,
  i.e. `api.<site>`). Any provider that verifies the redirect_uri's **domain** (Apple) must register +
  verify **`api.<site>`** (not the web/apex domain) and serve its verification file from the API — Apple's
  is `WellKnownModule` returning the `APPLE_DOMAIN_ASSOCIATION_TXT` env var at
  `/.well-known/apple-developer-domain-association.txt`. Getting this domain wrong surfaces as Apple's
  "Invalid client id or web redirect url". The API is ungated by Cloudflare Access, so `/.well-known/*`
  there needs no Access bypass (unlike the web app's paths).
- **Rate limiting (ADR 0050):** built-in `rateLimit`, Postgres-backed, keyed off `cf-connecting-ip`;
  env-toggled by `AUTH_RATE_LIMIT_ENABLED` (unset ⇒ on in prod, off in dev/test). It's boot config, not a
  DB flag.
- **`requireEmailVerification` is `true`** — a new account must verify its email before sign-in; the seed
  marks dev accounts `emailVerified: true`.
- **Seed dev users:** `pnpm --filter @TheY2T/tmr-api db:seed:auth` → `admin|editor|learner@local.dev` /
  `password123` (**local only**, email pre-verified).
- **ESM interop:** `better-auth` + `@thallesp/nestjs-better-auth` are ESM-only; Node 22 `require(esm)`
  loads them from the CJS build, and classic-`Node` tsc resolves their types (verified). No `paths`
  mapping needed.

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
- **Media upload:** `MediaLibrary.presignPutUrl` returns the API's `/media?key=…` route; the browser
  PUTs the bytes there (credentialed, RBAC `content:update`) and `PostgresMediaLibrary.putObject` stores
  them in `media_objects`. Public reads stream from `GET /media?key=…` (ADR 0048).
- **List responses wrap in `{ items }`** to match the contract; `POST .../publish` sets `@HttpCode(200)`
  (Nest defaults POST to 201).

## Localization (ADR 0034, `src/i18n/`)

The API owns the DB-backed UI-string catalogue served to `apps/web`, plus an admin CMS write side
(`docs/features/i18n.md`).
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
  `apply*Overlay` domain helpers. Any read module that overlays imports `TranslationsModule`. Search
  filters over the base fields, so catalogue/collections **search results stay base-locale** even when a
  read carries `?locale=` (detail/related still overlay); per-locale search is a later slice.

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
Auth vars: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `TRUSTED_ORIGINS`, `AUTH_COOKIE_DOMAIN` (dev defaults
are local-only); social providers `GOOGLE_/FACEBOOK_/MICROSOFT_CLIENT_ID+SECRET` and Apple
`APPLE_CLIENT_ID/TEAM_ID/KEY_ID/PRIVATE_KEY` (optional — a provider registers only when set);
`AUTH_RATE_LIMIT_ENABLED`.

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
