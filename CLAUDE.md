# CLAUDE.md — The Music Repository

Guidance for AI agents (and humans) working in this monorepo. Keep it current: update it whenever
a convention, command, or gotcha changes. Per-app notes live in `apps/*/CLAUDE.md`.

## What this is

A music-learning **repository/catalogue website** (piano & guitar first). Content is
originally-hosted + public-domain; interactive capabilities ship in **phases behind feature flags**.
The full build plan is at `~/.claude/plans/mutable-inventing-acorn.md`.

## Stack

Turborepo + pnpm workspaces (+ **catalogs**) · Astro SSR + React islands + Tailwind v4 + shadcn
(`apps/web`) · NestJS hexagonal + Postgres/Drizzle (`apps/api`) · OpenFeature + flagd (flags) ·
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
  flag keys + eval-context → `@TheY2T/tmr-flags`; **UI message strings → `@TheY2T/tmr-i18n-locales`**
  (`en.json` is the key source of truth) **via `@TheY2T/tmr-i18n`'s `t(locale, key)`**;
  **UI components → `@TheY2T/tmr-ui`; design tokens → `@TheY2T/tmr-design-tokens`**; dependency
  versions → **pnpm catalogs** in `pnpm-workspace.yaml` (add a version once, reference `catalog:`).
- **Build UI from the design system (web).** Compose `apps/web` UI from `@TheY2T/tmr-ui`
  (Atomic Design: atoms = shadcn primitives, then molecules → organisms) and style with
  `@TheY2T/tmr-design-tokens` — no bespoke raw-Tailwind chrome (buttons/cards/badges/inputs/page
  shells) in `apps/web`. Both are **raw-source ESM** (not dual-build). Templates/pages stay in
  `apps/web`. Library components are presentational + i18n-by-prop (never call `t()` inside). Follow
  the **`add-ui-component`** skill. ADR 0018 · `docs/features/design-system.md`.
- **Localize UI strings (web).** No hardcoded user-facing text in `apps/web` — add a key to
  `@TheY2T/tmr-i18n-locales` (English + `zh-Hans`) and render via `t(Astro.locals.locale, key)`; pass
  `locale` into islands as a prop. URL-prefix routing (`/zh/…`), gated by `platform.i18n`. Follow the
  **`add-translations`** skill. ADR 0017.
- **Ship features behind a flag.** Add the key to `@TheY2T/tmr-flags`, define it in
  `flags/flags.json`, gate with `@RequireFlagsEnabled` (api) / `useFlag` (web).
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

## Commands

```bash
pnpm install
pnpm dev                              # all apps (turbo)
pnpm --filter @TheY2T/tmr-api dev     # nest start --watch
pnpm --filter @TheY2T/tmr-web dev     # astro dev
pnpm build | pnpm lint | pnpm check-types | pnpm test   # turbo across workspace
pnpm --filter @TheY2T/tmr-api db:generate               # drizzle migration from schema
pnpm infra:up                                           # db + flagd (docker/podman); infra:down to stop
podman compose -f infra/podman/compose.yaml up          # full stack (db+flagd+api+web)
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
- TypeScript is pinned to the **5.x** line and ESLint to **9.x** (newer majors break NestJS/Astro
  tooling and typescript-eslint). Don't bump these blindly.
- Don't set `rootDir`/`outDir` in the shared `config-typescript/*.json` — TS resolves those relative
  to the config package, not the consumer. Set output paths in each app's own tsconfig.
- flagd must be running (`pnpm infra:up`) for live flag evaluation; otherwise providers return
  defaults and a single `[FeatureFlags] Could not reach flagd … run pnpm infra:up` hint is logged
  (the raw connection stack is suppressed by `apps/*/…/flagd-logger`). Don't add a disable-flag env
  toggle — the graceful hint is the intended behaviour.
