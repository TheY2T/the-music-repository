# ADR 0047 — A dev-only component sandbox app (`apps/sandbox`)

- **Status:** accepted
- **Date:** 2026-07

## Context

The UI lives in shared raw-source packages (`tmr-ui`, `tmr-musickit-ui`, `tmr-music-core`,
`tmr-common-ui`) consumed by the thin `apps/web` shell (ADR 0033). There is no isolated place to
exercise a component: a tester can only reach one via the real page that mounts it, wired to live API
data, real flags, and a fixed locale/theme. That makes it slow to review a component across its states,
themes, and locales, and impossible to see the presentational atoms/molecules or the headless engines
(audio, theory, soundfont, score, pixi) on their own.

Storybook is already present for the design system, but its isolated renderer does not reproduce the
production runtime (Astro SSR + React islands + the data-access port + the aesthetic/locale plumbing),
which is exactly what the music tools need to behave correctly.

## Decision

Add a **dev-only Astro app, `apps/sandbox`** (package `@TheY2T/tmr-sandbox`, port 4322), that mirrors
`apps/web`'s build and renders every shared component into a navigable, searchable catalogue.

- **Config parity with `apps/web`.** Same `astro.config.mjs` (SSR + node adapter, React + icon
  integrations, the alphaTab asset pipeline, and — critically — the `ssr.noExternal` list +
  `optimizeDeps` tuning), the same `global.css` (design tokens + the load-bearing `@source` globs), and
  the same pre-paint theme script, so components render exactly as they do in production.
- **Standalone — no API.** A thin middleware seeds dev-only `Astro.locals` (all flags on, anonymous
  user). Data-backed components read a **mock data-access port** (canned, already-resolved results), and
  UI strings resolve from the i18n engine's bundled fallback. The app needs nothing else running.
- **Registry-driven.** A single specimen registry (pure data + lazy loaders) lists every component,
  tagged by both **source package** and **feature-area domain**, with per-component prop controls. The
  sidebar groups both ways and searches; each specimen has an SSR page mounting a single-island stage.
- **Single-island playground.** One `client:only` React root per specimen wraps the component in the
  providers it may read (data port + instrument prefs), a controls panel (live props + locale toggle),
  and an optional engine inspector — respecting the rule that React context cannot cross islands.
- **Engine inspectors.** The headless `music-core` engines are surfaced as live panels: audio-bus scope,
  soundfont load status, the music-theory tables, the alphaTab score engine, and the WebGL/theme bridge.
- **Not deployed.** No Dockerfile, not in the `--profile app` compose stack. It exists for local
  development and review only.

## Consequences

- Reviewers and testers can exercise any component in isolation across all three aesthetics × light/dark
  and both locales, with live prop controls — without standing up the API or hunting for a host page.
- The sandbox is auto-registered as a workspace (`apps/*`) and participates in turbo tasks by script
  name; no root config changes are needed.
- Adding a component to the sandbox is a registry entry (plus an example wrapper when it needs sample
  data props). Components that need live API data render their empty/idle states against the mock port;
  seeding richer fixtures is a future enhancement.
- Pixi/`smplr`/alphaTab specimens are covered by E2E (Playwright), not component tests, to avoid the
  Vitest duplicate-React optimizer (per `.claude/rules/testing.md`).
- Storybook remains for isolated design-system stories; the sandbox complements it by running components
  in the real Astro-islands runtime.
