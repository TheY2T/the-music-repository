# CLAUDE.md — @TheY2T/tmr-musickit-ui

**All** music/learning experiences (ADR 0033): interactive tool islands, score UI,
catalogue/collections/drills, and the music organisms. Raw-source ESM. See root `CLAUDE.md`.

## Smart package — but props in, no locals

- MAY depend on `@TheY2T/tmr-api-client`, the `@TheY2T/tmr-web-data` seam, and `@TheY2T/tmr-i18n` — it
  fetches data and renders localized text internally, calling `t(locale, key)`.
- BUT takes `locale`/`flags`/`user` **as props** — **never** reaches for `Astro.locals` (that stays in
  `apps/web`). Pages pass them down.
- DAG position: `… → music-core → web-data → **musickit-ui** → common-ui → apps/web`. It imports
  `music-core`/`web-data`/`ui`, **never** `common-ui` (the two catalogue toggles `FavoriteHeart`/
  `SaveCollectionButton` live here so the cycle stays broken).

## Layout / exports

- Islands at the root (`./*`); music organisms at **`@TheY2T/tmr-musickit-ui/organisms`** (`ChordDiagram`,
  `StaffSequence` — SVG components over `music-core` data). Also `./content/*`, `./score/*`, `./data/*`.
- Build UI from `@TheY2T/tmr-ui` atoms/molecules — no bespoke raw-Tailwind chrome. Theme with **semantic
  token utilities only**, icons via the `Icon` atom. See `.claude/rules/design-system.md`.

## Feature rules

- **Interactive tools** — client-only, reuse `music-core`'s `music-theory`/`audio`/`soundfont`; see
  `.claude/rules/interactive-tools.md` + the **`embed-tool`** skill. Add/extend components via
  **`add-ui-component`**.
- **Notation** renders via alphaTab (`.claude/rules/scores.md`). **Drills** — `DrillSession` over
  `music-core/drills`; attempts via `web-data/drills-api`.

## Tests

Islands with hooks that hit the duplicate-React optimizer are covered by **E2E in `apps/web`**; pure logic
+ simple components run under this package's Vitest. See `.claude/rules/testing.md`.
