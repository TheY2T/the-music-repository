# CLAUDE.md — The Music Repository

Guidance for AI agents (and humans) working in this monorepo. Keep it current: update it whenever
a convention, command, or gotcha changes. Per-app notes live in `apps/*/CLAUDE.md`.

## Claude Code tooling (how guidance is organized)

This root file holds the **always-relevant** conventions. Deeper/situational guidance is split so it
loads only when it's needed:

- **Skills** (`.claude/skills/`, invoke `/name`): `add-endpoint`, `add-feature`, `add-adr`,
  `add-feature-doc`, `author-content`, `add-score`, `manage-flags`, `add-ui-component`, `add-pixi-tool`,
  `add-translations`, `add-seo`, `add-tests`, `embed-tool`, `run-local` — step-by-step workflows for
  repeated tasks.
- **Path-scoped rules** (`.claude/rules/*.md`, load when you touch matching files): `api-hexagonal`,
  `web-features`, `interactive-tools`, `scores`, `pixi`, `design-system`, `testing`, `content-authoring`,
  `flags`, `i18n`, `seo`.
- **Per-package `CLAUDE.md`** (load when working in that package): `packages/{music-core,musickit-ui,ui,
  nest-platform}`. Other packages are covered by this file + the rules.
- **App notes:** `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`. **Dev-only:** `apps/sandbox` — a component
  playground mirroring the web app that renders every shared component in isolation (ADR 0047,
  `docs/features/sandbox.md`); not deployed. **Docs:** ADRs in `docs/adr/`, one feature doc per feature
  in `docs/features/`.

## What this is

A music-learning **repository/catalogue website** (piano & guitar first). Content is
originally-hosted + public-domain; interactive capabilities ship in **phases behind feature flags**.
The full build plan is at `~/.claude/plans/mutable-inventing-acorn.md`.

## Stack

Turborepo + pnpm workspaces (+ **catalogs**) · Astro SSR + React islands + Tailwind v4 + shadcn
(`apps/web`) · NestJS hexagonal + Postgres/Drizzle (`apps/api`) · OpenFeature + DB-backed flags (ADR 0035) ·
Biome + thin ESLint · podman-compose deploy.

**Platform (Phase P) — every backend feature uses these:**
- **Spec-first APIs:** author `packages/api-spec/main.tsp` (TypeSpec) → `pnpm spec:generate` →
  `openapi.json` + generated Zod DTOs in `@TheY2T/tmr-contracts`. Paths live ONLY in TypeSpec. ADR 0006.
- **Errors:** throw framework-free `DomainError`s from `@TheY2T/tmr-errors`; the `PlatformModule`
  filter returns **RFC 9457 problem+json** with `code` + `traceId`. ADR 0007.
- **Observability:** OTEL preloaded via `--require`; log/trace/context via **ports** from
  `@TheY2T/tmr-observability` (never the SDKs); domain stays OTEL-free. `pnpm obs:up` for the stack. ADR 0008.
- **`PlatformModule`** (`@TheY2T/tmr-nest-platform`) wires all of it — one import in `AppModule`. ADR 0009.
- New endpoints: follow the **`add-endpoint`** skill.

## Golden rules

- **Package naming:** every workspace package is scoped `@TheY2T/tmr-*`. Folder names stay
  kebab-case; the scoped name lives in `package.json`.
- **Shared sources of truth (never duplicate):** types → `@TheY2T/tmr-contracts`;
  flag keys + eval-context → `@TheY2T/tmr-flags`; **UI message strings** are DB-backed + CMS-managed
  (ADR 0034), rendered **via `@TheY2T/tmr-i18n`'s `t(locale, key)`**; `@TheY2T/tmr-i18n-locales`'s
  `en.json` is the **key type source + DB seed** (add a new code-referenced key there once);
  **UI components → `@TheY2T/tmr-ui`; design tokens → `@TheY2T/tmr-design-tokens`**; dependency
  versions → **pnpm catalogs** in `pnpm-workspace.yaml` (add a version once, reference `catalog:`).
- **`apps/web` is a thin shell; complex UI lives in packages (ADR 0033).** The web app keeps only
  routes (`src/pages/**`), middleware/`Astro.locals`, flag-gating, `BaseLayout` + `global.css`, and
  prop-passing. All islands come from the shared **raw-source ESM** UI packages, in an acyclic DAG:
  `@TheY2T/tmr-design-tokens → tmr-ui → tmr-music-core → tmr-web-acl → tmr-musickit-ui → tmr-common-ui → apps/web`.
  - **`@TheY2T/tmr-ui`** — atoms (shadcn primitives) + molecules foundation. **Strictly presentational,
    i18n-by-prop (never calls `t()`), never fetches.** Style with `@TheY2T/tmr-design-tokens`.
  - **`@TheY2T/tmr-music-core`** — portable music logic: theory/audio/soundfont, the alphaTab score
    engine, PixiJS scenes + the `PixiCanvas` boundary, hooks, and chord-shape data (`chord-shapes`,
    `chord-library`, `staff-geometry`). Peers: react, pixi, alphatab, smplr.
  - **`@TheY2T/tmr-web-acl`** — the **anti-corruption layer** between the UI and `@TheY2T/tmr-api-client`:
    credentialed api-client wrappers, the Better Auth browser client, `nav`, the shared shell types
    (`Flags`/`User`/`Locale`), the DTO re-export boundary (`@TheY2T/tmr-web-acl/dto`), and the
    **data-access port** (`@TheY2T/tmr-web-acl/api-data`: `ApiDataProvider` + `useApiData()`). **No UI.**
    It is the **only** UI-facing package allowed to name `api-client`. `App.Locals` in
    `apps/web/src/env.d.ts` is derived from these types.
  - **`@TheY2T/tmr-musickit-ui`** — ALL music/learning experiences: tool islands, score UI,
    catalogue/collections/drills, and the music organisms (`ChordDiagram`, `StaffSequence` at
    `@TheY2T/tmr-musickit-ui/organisms`).
  - **`@TheY2T/tmr-common-ui`** — app-shell chrome + account/admin/billing/auth UI (header/footer,
    switchers, dashboards, forms, admin block editor).
  - **Smart packages:** `musickit-ui`/`common-ui` MAY consume `tmr-web-acl` / `tmr-i18n` and call
    `t(locale, key)` — but take `locale`/`flags`/`user` as **props**; never reach for `Astro.locals`.
    They **never depend on `tmr-api-client`** (not even for DTO types): they read live data through the
    injected **data-access port** (`useApiData()` from `@TheY2T/tmr-web-acl/api-data`) and import DTO
    types from `@TheY2T/tmr-web-acl/dto`. `apps/web` bootstraps the provider (`AppProviders`) around each
    interactive region; the port's concrete api-client binding lives in `web-acl`. No bespoke
    raw-Tailwind chrome in `apps/web`. Follow the **`add-ui-component`** skill. ADR 0018/0033/0037 ·
    `docs/features/design-system.md`.
- **Theme with tokens, not colors (web).** The site ships **3 vintage aesthetics × light/dark** (ADR
  0021) via `data-theme` (`hybrid`/`heritage`/`warm-minimal`) + the `.dark` class on `<html>`, switched
  by `ThemeSwitcher` in the global `SiteHeader`. Every component MUST use **semantic token utilities**
  (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-accent/15`, `font-display`) — hardcoded
  palette colors (`bg-amber-500`, `text-red-500`, hex) don't re-theme (music-notation SVG excepted).
  Global chrome (`SiteHeader`/`SiteFooter`) lives in `BaseLayout`; nav is built in `apps/web/src/lib/nav.ts`.
- **Icons from the design system (web).** No emoji/unicode as icons in `apps/web` — use the **`Icon`
  atom** from `@TheY2T/tmr-ui` (`<Icon name="lock" className="size-4" />`) in React, and
  `@TheY2T/tmr-ui/astro/Icon.astro` in `.astro`. Both are Lucide; add an icon via the registry in
  `packages/ui/src/components/ui/icon.tsx`. Never bake glyphs into i18n strings. Music-notation glyphs
  (`♯♭♮♪♩`) are the sole exception. Follow **`add-ui-component`**. ADR 0018/0019 · `docs/features/icons.md`.
- **Localize UI strings (web).** No hardcoded user-facing text in `apps/web` — render via
  `t(Astro.locals.locale, key)` and pass `locale` into islands as a prop. String **values are DB-backed
  and edited in the admin CMS** (`/admin/localization`, ADR 0034); the in-repo
  `@TheY2T/tmr-i18n-locales` JSON is the DB **seed** + compile-time `MessageKey` type + fallback, so a
  brand-new code-referenced key still gets added there once. URL-prefix routing (`/zh/…`), gated by
  `platform.i18n`. Follow the **`add-translations`** skill. ADR 0017/0034.
- **SEO is Definition of Done (web; ADR 0039).** Every indexable page sets **`title` + `description`** on
  `BaseLayout`, which always emits a self/per-locale canonical, Open Graph/Twitter card, and hreflang.
  **Content detail pages server-fetch their metadata** (`@TheY2T/tmr-web-acl/server-content`) so the
  crawler-visible `<head>` carries the real title/description/JSON-LD (never a client-rendered title).
  Private routes pass **`noindex`**; new content types get a JSON-LD builder (`apps/web/src/lib/seo.ts`) +
  a sitemap child. Always-on infra (no flag); `PUBLIC_SITE_URL` must be set per env. Follow **`add-seo`**.
- **Ship features behind a flag (DB-backed, per-environment; ADR 0035).** Add the key to
  `@TheY2T/tmr-flags` (`FlagKeys` + `FlagDefaults`) + map its web field in `FLAG_FIELD_BY_KEY`
  (`@TheY2T/tmr-web-acl`), gate with `@RequireFlagsEnabled` (api) / `Astro.locals.flags` prop (web); it
  **seeds into the DB** on `db:seed`. Toggle per environment in the admin CMS (`/admin/feature-flags`).
  Follow the **`manage-flags`** skill.
- **Test every feature (Definition of Done).** Ship tests with the code: **unit** for logic/use-cases
  (mock **ports**, never Drizzle), **component** for islands/UI (i18n-by-prop), **E2E** for user flows.
  Vitest (unit/component) + Playwright (E2E) + Testcontainers (api integration); shared runner config
  from `@TheY2T/tmr-config-vitest`. Follow the **`add-tests`** skill. ADR 0020 · `docs/features/testing.md`.
- **Docs are Definition of Done.** Every feature gets `docs/features/<feature>.md`; every
  significant decision gets an ADR in `docs/adr/`. Update Mermaid diagrams in `docs/architecture/`.
- **Hexagonal dependency rule (api):** `domain ← application ← infrastructure/presentation`.
  Use-cases depend on **ports** (abstract classes), never on Drizzle. Bind adapters in the module.
- **Port naming (ADR 0012):** ports are named for the **domain capability** the core needs (ubiquitous
  language), **never the technology, no `Port` suffix** — e.g. `CatalogueSearch`, `MediaLibrary`,
  `ContentRepository`, `DatastoreHealthCheck`. Adapters are `<Technology><Capability>` (e.g.
  `MeilisearchCatalogueSearch`, `S3MediaLibrary`). Applies to every feature, skill, and doc.
- **Islands (web):** context-dependent shadcn components must be composed inside **one** `.tsx`
  island root — React context is not shared across separate islands.

## Casing

kebab-case files in `apps/api`; PascalCase component files in `apps/web`; Astro pages lowercase/kebab;
PascalCase types/classes; camelCase vars; UPPER_SNAKE constants/env; snake_case DB columns.

## Comments & copy — describe current functionality only

In UI copy, docs, and code comments/JSDoc, describe **what the thing does**, written as if the code was
always this way. **No change-narration or editorializing** — drop "drop-in replacement for X", "replaces
the old Y", "now backed by…", "unchanged after the swap", "mirrors Z", "Phase N", and marketing asides
("no redeploy", "instantly", "safety net"). Nobody (user, admin, developer) benefits from what it used to
be. ADRs are the exception — they record decisions and what they supersede.

## Commands

```bash
pnpm install
pnpm dev                              # all apps (turbo)
pnpm --filter @TheY2T/tmr-api dev     # nest start --watch
pnpm --filter @TheY2T/tmr-web dev     # astro dev
pnpm build | pnpm lint | pnpm check-types | pnpm test   # turbo across workspace
pnpm test:coverage | pnpm test:integration              # v8 coverage · api Testcontainers (Docker)
pnpm test:e2e | pnpm test:e2e:live                      # Playwright: mocked (hermetic) · full stack
pnpm --filter @TheY2T/tmr-api db:generate               # drizzle migration from schema
pnpm infra:up                                           # backing services only: db+meili+minio (run api/web on host); infra:down to stop
pnpm app:up                                             # full containerized app: infra + api + web via `--profile app` (builds images); app:down to stop
pnpm obs:up                                             # optional observability stack (separate project); obs:down to stop
```

## Gotchas

- Internal packages (`contracts`, `flags`) are built by **tsup as dual ESM + CJS** with an `exports`
  map (`import`→`.js`, `require`→`.cjs`) plus top-level `main`/`types` for NestJS's classic resolver.
  Astro (Vite/ESM) gets the ESM build; NestJS (CJS) gets the CJS build. They must be **built** before
  the apps typecheck/build (turbo `^build` handles it). Do **not** make them CJS-only — Astro dev
  (Vite 8 + oxc) loads the ESM build and CJS-only output throws `exports is not defined`.
- **tsconfig `extends` uses relative paths** (`../config-typescript/base.json`), not the scoped
  package name. Vite 8's oxc transform reads a built package's nearest `tsconfig.json` and its
  extends resolver does **not** do node package resolution → package-name extends throws
  `[TSCONFIG_ERROR] Tsconfig not found`. Code imports still use scoped names (`@TheY2T/tmr-*`); only
  `tsconfig extends` is relative. See ADR 0005.
- **Docker builds must copy `tsconfig.base.json` back in after `turbo prune`.** The app Dockerfiles
  build from `turbo prune --docker`, which copies workspace packages (incl. `config-typescript`) but
  **not** root-level config files. Since `packages/config-typescript/base.json` extends the repo-root
  `../../tsconfig.base.json` (where the real `compilerOptions` incl. `esModuleInterop` live), the DTS/tsc
  builds silently lose those options and fail (e.g. pino `can only be default-imported` errors). Both
  `apps/*/Dockerfile`s `COPY --from=pruner /app/tsconfig.base.json ./` before `turbo run build` — keep it.
- TypeScript is pinned to the **5.x** line and ESLint to **9.x** (newer majors break NestJS/Astro
  tooling and typescript-eslint). Don't bump these blindly.
- Don't set `rootDir`/`outDir` in the shared `config-typescript/*.json` — TS resolves those relative
  to the config package, not the consumer. Set output paths in each app's own tsconfig.
- **Feature flags are DB-backed (ADR 0035), not flagd.** The api evaluates in-process from Postgres for
  `APP_ENV`; the web SSR fetches `GET /feature-flags/snapshot/:env` (ETag/304) and evaluates with the same
  `@TheY2T/tmr-flags-eval` engine. Toggle per-environment in `/admin/feature-flags`. If the
  snapshot source is unreachable, flags fall back to code `FlagDefaults` (the app still boots). There is no
  flagd container / `flags/flags.json` — don't reintroduce them.
- **PixiJS is client-only + lazy (web).** The WebGL layer (ADR 0022) is added via
  `apps/web/src/components/PixiCanvas.tsx` — it lazy-imports scenes and renders an accessible DOM
  fallback during SSR, so tool pages keep `client:load`. `pixi.js`/`@pixi/react` are cataloged (one
  copy) and deliberately **not** in `optimizeDeps.include` (including them pulls a duplicate React
  into the Vitest optimizer → "invalid hook call"); Vite optimizes them on first dev use (a one-time
  `504 Outdated Optimize Dep` that self-heals). Pixi canvases read theme colours via
  `useThemeColors()` (never `var(--token)`). See `docs/features/pixi-visualization.md`.
