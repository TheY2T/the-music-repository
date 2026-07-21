# Feature: Component Sandbox (`apps/sandbox`)

- **Phase:** Tooling · **Status:** shipped
- **Flag key:** none (dev-only app; not deployed)
- **ADR:** [0047](../adr/0047-component-sandbox-app.md)

A dev-only Astro app that renders every shared UI component into a browsable, searchable playground so
testers and developers can exercise components in isolation — with live prop controls, theme + locale
switching, and live engine inspectors — without running the API or finding a host page.

## Run it

```bash
pnpm --filter @TheY2T/tmr-sandbox dev      # http://localhost:4322 (alongside apps/web on 4321)
```

It is standalone: no API, no database, no seed. Flags are all on, the visitor is anonymous, UI strings
come from the i18n engine's bundled fallback, and data-backed components read a mock data-access port.

## Layout

- **`apps/sandbox`** mirrors `apps/web`'s build — `astro.config.mjs` (SSR + node adapter, React + icon
  integrations, the alphaTab asset pipeline, `ssr.noExternal`, `optimizeDeps`), `src/styles/global.css`
  (design tokens + the `@source` globs that generate the packages' utilities), and the pre-paint theme
  script. If a package's styles go missing, check the `@source` globs + `ssr.noExternal` (as in the web
  app).
- **`src/middleware.ts`** — thin, no fetch: seeds `Astro.locals` (locale from URL/cookie, all flags on,
  anonymous user, empty i18n catalogue).
- **`src/registry/`** — the single source of truth. `types.ts` defines a `Specimen`; `ui.ts`,
  `musickit-ui.ts`, `common-ui.ts`, `music-core.ts` populate it; `index.ts` combines them and provides
  the `groupByPackage()` / `groupByDomain()` groupings + labels.
- **`src/components/`** — `SandboxNav` (sidebar: package/domain toggle + search), `AppearanceMenu` (the
  shared `ThemeSwitcher` in the top bar), `SpecimenStage` (the single-island playground root),
  `ControlsPanel` (prop controls + locale toggle), `SandboxProviders` (data port + instrument prefs).
- **`src/inspectors/`** — live engine views: `AudioInspector` (master-bus scope + focus),
  `SoundfontInspector` (per-instrument load status), `TheoryInspector` (scales/chords/modes/intervals
  tables), `ScoreInspector` (alphaTab engine), `PixiInspector` (WebGL + theme-colour bridge).
- **`src/examples/`** — pre-composed wrappers for components that need sample data props (compound UI
  atoms, organisms, score surfaces).
- **`src/lib/mock-port.tsx`** — the canned `ApiDataPort` implementation.
- **`src/pages/`** — `index.astro` (overview, both groupings) and `c/[id].astro` (one page per specimen,
  mounting `SpecimenStage` `client:only`).

## How it works

Each specimen page mounts a **single React island** (`client:only`) that wraps the component in
`SandboxProviders`, so the data-access port + instrument-preferences context and the component all live
in one root — React context cannot cross island boundaries. The `ControlsPanel` owns the prop state and
re-renders the component on each change; a built-in locale toggle swaps the `locale` prop; the top-bar
`AppearanceMenu` re-themes the whole page (aesthetic + light/dark) via the same `<html>` hooks the web
app uses. A rendering error boundary keeps one broken specimen from taking down the app.

## Add a specimen

1. Add an entry to the matching `src/registry/*.ts` file: `id`, `name`, `pkg`, `domains`, `kind`, and a
   `load` (a lazy `import()` of the component's package subpath) with `exportName` for named exports.
2. Add `controls` (a `ControlSpec[]`) for the props worth tweaking; a locale toggle is always added.
3. If the component needs sample data props, write a small wrapper in `src/examples/*` and point `load`
   at it instead. For a headless engine, set `inspector` (and no `load`).

## Tests

- **Unit/component (Vitest):** registry integrity, the mock-port shape, `ControlsPanel` behaviour, and
  the theory data source (`src/**/*.test.{ts,tsx}`).
- **E2E (Playwright):** boot, search, prop controls, theme + locale switching, an interactive tool with
  its inspector, and a mock-port-backed component (`e2e/sandbox.spec.ts`). Pixi/`smplr`/alphaTab
  specimens are E2E-only (Vitest duplicate-React optimizer — see `.claude/rules/testing.md`).

## Not deployed

The sandbox has no Dockerfile and is not in the `--profile app` compose stack. It is a local
development + review tool only.
