# CLAUDE.md — apps/web (Astro)

Astro SSR + React islands + Tailwind v4 + shadcn. See root `CLAUDE.md` for repo-wide rules. This file is
the **shell playbook**; situational detail loads from `.claude/rules/*` and `docs/features/*`.

## `apps/web` is a SHELL (ADR 0033)

Complex UI lives in shared raw-source ESM packages, not here. This app keeps only: routes, middleware /
`Astro.locals`, flag-gating, `BaseLayout` + `global.css`, and prop-passing. Pages mount package islands and
pass `locale`/`flags`/`user` down as **props**. **`Astro.locals` never leaves `apps/web`.**

- **Music/learning UI** (tool islands, score UI, catalogue/collections/drills, music organisms) →
  `@TheY2T/tmr-musickit-ui` (`/organisms` for `ChordDiagram`/`StaffSequence`).
- **Shell chrome + account/admin/billing/auth UI** → `@TheY2T/tmr-common-ui` (`SiteHeader`,
  `astro/SiteFooter.astro`, `ThemeSwitcher`, dashboards, forms, admin block editor).
- **Music logic** (theory/audio/soundfont, alphaTab engine, PixiJS scenes + `PixiCanvas`, chord data) →
  `@TheY2T/tmr-music-core`.
- **Anti-corruption layer** (api-client wrappers, `auth-client`, `nav`, the `useApiData()` data-access
  port + DTO re-exports, `Flags`/`User`/`Locale` types) → `@TheY2T/tmr-web-acl`. Bootstrap the port with
  `AppProviders` (`src/components/providers/`) around a region; mount islands via the wrappers in
  `src/components/islands/*` (ADR 0037).

## Structure

```
src/
  pages/*.astro        # routes (lowercase/kebab, [slug].astro) — thin shells: read Astro.locals,
                       #   gate flags, mount a package island with props
  layouts/BaseLayout.astro  # shell entry: global.css + pre-paint theme + composes common-ui chrome
  lib/admin-guard.ts   # reads Astro.locals (stays in the app)
  styles/global.css    # Tailwind v4 (@import) + @import @TheY2T/tmr-design-tokens + @source globs
  middleware.ts        # OpenFeature SSR eval → Astro.locals.flags; locale + session resolution
  env.d.ts             # App.Locals typing — derived from @TheY2T/tmr-web-acl (Flags/User/Locale)
```

Adding a package island to a route: add it to the package (**`add-ui-component`**), import it in the
`.astro` page, pass `locale`/`flags`/`user` props. **Wiring a NEW package:** add it to `astro.config.mjs`
`ssr.noExternal` **and** a `@source` glob in `global.css` (else its utilities don't generate).

## Conventions (details in rules)

- **Design system** (`.claude/rules/design-system.md`, ADR 0018) — build from `@TheY2T/tmr-ui`
  atoms/molecules; wrap page content in `PageShell` inside `BaseLayout`; **theme with semantic token
  utilities only** (no hardcoded palette colours); **icons via the `Icon` atom** (no emoji/glyphs).
- **i18n** (`.claude/rules/i18n.md`, ADR 0017) — no hardcoded UI strings; render via `t(locale, key)`;
  pass `locale` into islands as a plain prop; `/zh/…` URL-prefix routing.
- **Islands** — one island root per interactive unit (React context doesn't cross islands); hydrate
  minimally (`client:load` only where immediately interactive; else `client:visible`/`idle`); static
  markup stays in `.astro`.

## Feature areas (read the doc before editing)

Each feature has a `docs/features/*.md`; the shell-level gotchas are in `.claude/rules/web-features.md`
(auth SSR origin / redirect-loop trap, monetization dual-flag). Mount a package island + gate on the flag
(+ login where noted); pass `showX` flags derived in the page frontmatter.

| Area | Flag | Doc |
|---|---|---|
| Auth (sign-in gate) | `auth.enabled` | `auth.md` (ADR 0013) |
| Admin CMS | `admin.cms` (+ block-editor) | `admin-cms.md`, `block-editor.md` |
| Favorites | `personalization.favorites` | `favorites.md` |
| Collections | `learning.collections*` | `collections.md` |
| Progress + tool practice | `learning.progress`, `.tool-practice` | `progress.md` |
| Info View (help) | `learning.info-view` | `info-view.md` |
| Monetization (DEFERRED) | `monetization.premium` / `.messaging` | `monetization.md` |
| Classrooms | `education.classrooms` | `classrooms.md` |

## Interactive tools, scores & Pixi

- **Tools** — client-only, one `/tools/<slug>` route per `tools.*` flag; reuse `music-core`'s
  `music-theory`/`audio`/`soundfont`. See `.claude/rules/interactive-tools.md`,
  `docs/features/interactive-tools.md`, and the **`embed-tool`** skill (every tool + how to embed one).
- **Scores** — alphaTab is the single engine (ADR 0027). Gotchas in `.claude/rules/scores.md`; author with
  **`add-score`**. Notation-bearing tools generate alphaTex, not hand-authored `StaffSequence`.
- **PixiJS** — client-only WebGL via the `PixiCanvas` boundary. See `.claude/rules/pixi.md` +
  **`add-pixi-tool`**. Decorative dashboard backgrounds: `docs/features/dashboard-background.md`.
- **Drills** — `DrillSession` over `music-core/drills`; `docs/features/drill-engine.md`.

## Styling / theming (ADR 0021, `.claude/rules/design-system.md`)

Tailwind v4 in CSS (`@import "tailwindcss"`), not a JS config. Tokens + `@theme inline` + the `.dark`
variant come from `@TheY2T/tmr-design-tokens` (imported in `global.css`); its `@source` globs make library
utilities generate — **if styles vanish, check them**. Two `<html>` hooks set pre-paint in `BaseLayout`:
aesthetic → `data-theme="hybrid|heritage|warm-minimal"` and mode → `.dark`; switched by `ThemeSwitcher`.
Storybook host: `@TheY2T/tmr-storybook` (port 6006).

**Global chrome:** `BaseLayout.astro` renders `SiteHeader` + `SiteFooter.astro`. Nav is derived per-request
in `src/lib/nav.ts` (`buildPrimaryNav`/`buildAccountNav` from `Astro.locals`) — **add a nav destination
there, not inline per-page.**

## Feature flags & testing

- **Flags** (`.claude/rules/flags.md`, **`manage-flags`**, ADR 0035) — **DB-backed** (no flagd):
  `middleware.ts` fetches `GET /feature-flags/snapshot/:APP_ENV` from the API and evaluates per request into
  `Astro.locals.flags` (typed, derived from the registry) + `Astro.locals.flagSnapshot` (raw map incl.
  admin-created runtime keys). **Pass values into islands as props** so first paint matches the server.
  Toggle per-environment in `/admin/feature-flags`.
- **Testing** (`.claude/rules/testing.md`, ADR 0020) — Vitest unit/component (i18n-by-prop, render the
  island root; `.astro` covered by E2E) + Playwright E2E (mock default / `TMR_E2E_MODE=live`). Islands that
  hit the duplicate-React optimizer (Pixi/`smplr`) are E2E-only. Clean up test artifacts after runs.

## Commands

`pnpm --filter @TheY2T/tmr-web dev|build|preview|check-types|lint|test|test:e2e` (or root `pnpm test:e2e` /
`test:e2e:live`). Local run + troubleshooting: **`run-local`** skill.
