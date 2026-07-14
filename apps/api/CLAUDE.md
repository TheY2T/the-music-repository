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
- **Catalogue content** (rich `body_mdx` + `details` JSONB facts + curated `related`) is authored as
  one Markdown file per item in `src/infrastructure/database/content/<slug>.md`; run
  `pnpm --filter @TheY2T/tmr-api content:build` to regenerate the build-safe `seed-content.ts` bundle
  the seed consumes. Era is a Meilisearch facet derived from `details.era` (no SQL taxonomy table). See
  `docs/features/catalogue.md`.
- **Collections** (`src/collections/`, ADR 0023) are authored the same way:
  `content/collections/<slug>.md` (frontmatter + `## Outcomes` + `## Section:` blocks with
  `- slug (note: …; skills: […])` items) → `pnpm --filter @TheY2T/tmr-api collections:build` →
  `seed-collections.ts`. A collection is rich metadata + `collection_sections` + `collection_items`
  (own uuid PK, `section_id`, `curator_note`, `focus_skills`). The domain `Collection.itemSlugs` MUST stay
  a **flattened, section-ordered** list — the progress module reads it. Ports: `CollectionRepository`,
  `CollectionBookmarks`, `CollectionRatings`, `CollectionSearchIndex` (Meili `collections` index,
  reindexed on seed + writes; private user collections never indexed), + a thin `LearnerProgress`
  (reads `content_progress` — avoids a cycle with `ProgressModule`). User-collection ownership is enforced
  in the use-cases (403), not the path. See `docs/features/collections.md`.

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

## Monetization / entitlements (Phase 6, ADR 0015)

Premium gating lives in `src/entitlements/`. `Entitlements` port (`getPremium`/`grantPremium`/
`revokePremium`) ← `DrizzleEntitlements` (`entitlements` table); request-scoped `PremiumAccessService`
combines `CurrentUser` + `Entitlements` into **entitled = staff OR active premium grant**.
`SubscriptionController` exposes `/me/subscription` (get/activate/cancel — a **mock checkout**), gated by
`monetization.premium` via **method-level** `@RequireFlagsEnabled` (class-level drops route mapping).

- **Catalogue gating** = locked preview, **tiered** (ADR 0015 + 6B): content has a `tier`
  (`premium`/`pro`; null = premium). The controller resolves the viewer's **rank** (`entitledRank` over
  `PremiumAccessService.viewerEntitlement().keys`, or Infinity for staff / flag off) and passes it into
  `SearchCatalogue`/`GetContentBySlug`, which lock a premium item when `viewerRank < tierRank(item.tier)`
  — so `premium` unlocks `premium` but not `pro`. Ranks live in the catalogue domain (`TIER_RANK`).
  `Entitlements.grant(key)`/`activeKeys` are the tier-aware primitives (`grantPremium` = `grant('premium')`).
- **Reading the viewer on public routes:** the catalogue is anonymous, so use `ResolveOptionalAuth()`
  (wraps the library's `@OptionalAuth()`) — resolves the session when present, never rejects anon. Plain
  `@RequireAuth()` still can't populate `CurrentUser` on an otherwise-public route.
- **New flag keys need flagd reloaded** (`docker compose … restart flagd`) or `@RequireFlagsEnabled`
  route-gates 404 while the imperative `getBooleanValue(default)` path still works.
- The seed upsert updates `visibility`; mark premium items with `visibility: 'premium'` in `seed-data.ts`.

**Mail (`src/mail/`):** `MailSender` port bound by `MailModule`'s factory to `LogMailSender` (dev/CI —
logs, no delivery) or `SmtpMailSender` (nodemailer) when `SMTP_URL` is set. Inject the port anywhere
(e.g. classroom invitations). Env: `SMTP_URL`, `MAIL_FROM`.

**Billing (Stripe checkout + webhook, `src/billing/`, ADR 0016):** `CheckoutGateway` port bound by a
factory to `MockCheckoutGateway` (default) or `StripeCheckoutGateway` (when `STRIPE_SECRET_KEY` is set).
`POST /me/checkout` (in TypeSpec, `@RequireAuth` + `monetization.premium`) takes a `{ plan }`
(`premium`/`pro`) — the plan is recorded on `checkout_sessions.entitlement_key`, and the webhook grants
that tier via `Entitlements.grant(key)`. Stripe selects the price by plan (`STRIPE_PRICE_ID` /
`STRIPE_PRO_PRICE_ID`). Subscription **status** reflects any active tier; **cancel revokes all tiers**.
It returns a redirect URL;
`POST /billing/webhook` (NOT in TypeSpec — inbound provider endpoint like Better Auth, unauthenticated)
verifies + normalizes the event and calls the existing `Entitlements.grantPremium`/`revokePremium`.
Idempotency via `WebhookLedger` (`processed_webhooks`); session↔user via `CheckoutSessionStore`
(`checkout_sessions`). **Raw-body caveat:** Stripe signature verification needs the exact bytes, but
`bodyParser:false` + Better Auth mean `req.rawBody` isn't captured — the controller re-serializes the
parsed body (fine for the mock, which skips signatures; add raw-body capture when real keys land). See
`docs/features/billing.md`.

**Classrooms (teacher mode, `src/classrooms/`, flag `education.classrooms`):** `ClassroomsRepository`
← `DrizzleClassrooms` (`classrooms` + `classroom_members`); use-cases in one `classrooms.use-cases.ts`;
codes via `crypto.randomInt`. `GrantClassroomPremiumUseCase` imports the `Entitlements` port
(EntitlementsModule) → `grantPremium(memberId, 'classroom')` per member. **Auto-grant:** `JoinClassroom`
grants premium to a new joiner when the class is `premiumGranted`. **Roster:** leave (owner blocked),
remove-member (owner), archive (owner; `archived_at`, filtered from `findByCode`/`listForUser`),
transfer-ownership (owner → a member). **Assignments + progress:** `classroom_assignments` table;
owner assigns content by slug; `GET /classrooms/{id}/progress` joins assignments × members ×
`content_progress` for per-student `completedCount/total` (no cross-module coupling). Same flag gotchas
as monetization (method-level `@RequireFlagsEnabled`, reload flagd). See `docs/features/classrooms.md`.

**Gift/redeem codes (`src/redemption/`, 6B) + entitlement audit log:** `RedeemCodeStore` ←
`DrizzleRedeemCodeStore` (`redeem_codes`); atomic `consume` (`UPDATE ... WHERE uses_remaining > 0
RETURNING`). `CreateRedeemCode` is staff-only (checks `CurrentUser` roles → 403 `NOT_STAFF`); `RedeemCode`
→ `Entitlements.grantPremium(_, 'redeem', expiresAt)`. `DrizzleEntitlements` appends to `entitlement_events`
on every grant/revoke (all sources captured); `GET /me/entitlements/history`. See `docs/features/redemption.md`.

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
