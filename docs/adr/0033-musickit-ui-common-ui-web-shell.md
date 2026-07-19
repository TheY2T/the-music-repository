# ADR 0033 — MusicKit UI / Common UI / Web-Data packages: `apps/web` becomes a shell

- **Status:** accepted
- **Date:** 2026-07
- **Supersedes (in part):** ADR 0018 (which kept templates/pages, single-use tool visuals, and all
  audio/theory logic in `apps/web`, and required library components to be strictly presentational).
- **Superseded (in part) by:** ADR 0037 (renames `web-data` → `web-acl`; the smart packages no longer
  depend on `@TheY2T/tmr-api-client` — they consume an injected data-access port).

## Context

After ADR 0018 the design system held only leaf primitives (`@TheY2T/tmr-ui` atoms/molecules + a small
`tmr-ui/music` subpath, `@TheY2T/tmr-design-tokens`). Everything else — ~114 React island components,
~60 tool routes, all music logic (`lib/music-theory`, `audio`, `soundfont`, `pixi/*`, `score/*`), and
the data seam (`lib/*-api.ts`, `auth-client.ts`) — lived in `apps/web`. The app was the monolith and
the library was the exception. We want the inverse: **`apps/web` a thin shell** (routing, middleware /
`Astro.locals`, flag-gating, the `BaseLayout` + `global.css` entry, prop-passing) with **all complex UI
in shared packages**, so the music/learning UI can evolve and be reused independently of the app.

## Decision

1. **Five web-only, raw-source ESM packages** (the ADR 0018 pattern: `main`/`types`/`exports` → `./src/*`,
   no build step, `files:["src"]`; consumed + compiled by the app's Vite/Astro):
   - **`@TheY2T/tmr-ui`** — atoms + molecules foundation (unchanged; its `./music` organism subpath is
     removed and moved out).
   - **`@TheY2T/tmr-music-core`** — portable, mostly-headless music logic: theory, audio, soundfont,
     the alphaTab **score engine**, PixiJS **scenes + the `PixiCanvas` boundary**, hooks, and the
     chord-shape **data/geometry**. Peers: `react`, `react-dom`, `pixi.js`, `@pixi/react`,
     `@coderline/alphatab`, `smplr`.
   - **`@TheY2T/tmr-web-acl`** — the **data seam**: credentialed api-client wrappers, the Better Auth
     browser client, shell config (`nav`), and the shared shell **types** (`Flags`/`User`/`Locale`).
     **No UI.**
   - **`@TheY2T/tmr-musickit-ui`** — **all** music/learning experiences: interactive tool islands,
     score UI, catalogue/collections/drills, and the music organisms (`StaffSequence`, `ChordDiagram`).
   - **`@TheY2T/tmr-common-ui`** — app-shell chrome + account/admin/billing/auth UI (header/footer,
     switchers, `InfoView`, dashboards, forms, the admin block editor, …).

2. **Smart packages, thin web (relaxes ADR 0017/0018 §6).** `common-ui` and `musickit-ui` components
   depend on the `web-acl` layer and `@TheY2T/tmr-i18n` — they fetch data and render localized text
   internally, calling `t(locale, key)` with **`locale`/`flags`/`user` passed in as props**.
   **Superseded in part by ADR 0037:** these packages no longer depend on `@TheY2T/tmr-api-client`
   directly — they read data through the injected `useApiData()` port and import DTO types from
   `@TheY2T/tmr-web-acl/dto`; only `web-acl` (the anti-corruption layer) names api-client.
   `@TheY2T/tmr-ui` alone stays strictly presentational / i18n-by-prop.
   **`Astro.locals` never leaves `apps/web`** — pages read locals, gate flags, and pass props down.

3. **Acyclic UI DAG:**
   `design-tokens → ui → music-core → web-acl → musickit-ui → common-ui → apps/web`
   (`web-acl → ui` for the `IconName` type only; `music-core → ui` for `cn`). The data seam sits below
   both UI packages, and the two catalogue toggles (`FavoriteHeart`, `SaveCollectionButton`) live in
   `musickit-ui`, so `musickit-ui` never imports `common-ui`. `common-ui` **does** import `musickit-ui`
   (the admin block-editor previews music content: `ContentBody`/`ContentEmbeds`/`AlphaTexScore`).

4. **The `tmr-ui/music` split.** Chord-shape **data** (`chord-shapes.ts`, `chord-library.ts`,
   `staff-geometry.ts`) drops to `music-core` (below `embeds.ts`, which needs it); the SVG **components**
   (`ChordDiagram`, `StaffSequence`) rise to `musickit-ui/organisms`, which re-exports the data from
   music-core for a single import surface (`@TheY2T/tmr-musickit-ui/organisms`).

5. **`apps/web` keeps** `src/pages/**` (thin route shells), `src/middleware.ts`, `src/env.d.ts`
   (`App.Locals` **derived from** `@TheY2T/tmr-web-acl`'s `Flags`/`User`/`Locale`), `src/lib/admin-guard.ts`,
   `src/layouts/BaseLayout.astro`, and `src/styles/global.css`. `BaseLayout` + `global.css` stay in the
   app because Tailwind v4 content-scanning and the `@import "tailwindcss"` entry are consumer-side; the
   alphaTab Vite plugin + font/soundfont asset copying also stay in `astro.config.mjs`.

6. **Wiring:** all four new packages are added to `vite.ssr.noExternal` and to the `@source` globs in
   `global.css` (except `web-acl`, which ships no utility classes but still needs `noExternal`).
   `optimizeDeps.include` is unchanged (pixi/alphatab stay lazy + out of it → no duplicate-React).

## Consequences

- `apps/web/src/components` is emptied (only a `ui/button` + `lib/utils` back-compat shim remain);
  pages mount package islands with props. Music UI evolves independently of the shell.
- The data/auth seam is now its own layer (`web-acl`) — cleaner than the ADR-0018-era habit of leaving
  fetch wrappers beside UI, and it is what keeps the DAG acyclic.
- Package tsconfigs disable `noUncheckedIndexedAccess` + `declaration`/`declarationMap` to match the
  `astro/tsconfigs/strict` environment the code was authored under (raw-source, `noEmit`).
- Island/hook component tests that need Astro's `getViteConfig` or hit the duplicate-React optimizer
  stay as **E2E in `apps/web`**; pure logic + simple component tests move with their code and run under
  each package's `reactPreset` (happy-dom + jest-dom).

## Alternatives considered

- **Keep the data seam in `common-ui`** — creates a `common-ui ↔ musickit-ui` cycle (admin previews
  music content while musickit fetches). Rejected: extracting `web-acl` keeps the DAG acyclic.
- **Accept a package-level cycle** (declare the dependency both ways) — pnpm/Vite tolerate it, but it
  violates the one-way layering and risks the turbo task graph. Rejected.
- **Bundle music logic inside `musickit-ui`** — rejected: a headless `music-core` keeps logic reusable
  and lets `common-ui` backgrounds use the Pixi boundary without pulling in music UI.
