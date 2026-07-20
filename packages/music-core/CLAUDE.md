# CLAUDE.md — @TheY2T/tmr-music-core

Portable, mostly-headless music logic (ADR 0033). Raw-source ESM (no build step) — the app's Vite/Astro
compiles it. See root `CLAUDE.md` for repo-wide rules.

## Boundary

- **This package is logic + engine + data — NOT app UI and NOT a data-fetcher.** No api-client, no
  `t()`/i18n, no `Astro.locals`. It sits low in the DAG:
  `design-tokens → ui → **music-core** → web-acl → musickit-ui → common-ui → apps/web`.
- Peers (don't bundle — the consumer provides): `react`, `react-dom`, `pixi.js`, `@pixi/react`,
  `@coderline/alphatab`, `smplr`.
- It imports `@TheY2T/tmr-ui` only for `cn`.

## What lives here

- **Theory:** `music-theory.ts` — the single source of truth (`SCALES`, `CHORDS`, symbol/aliases/level,
  12-TET helpers). Extend it here; tools + embeds derive from it.
- **Audio:** `audio.ts` — dependency-free Web Audio (one-shots, lookahead scheduler, master bus,
  `getAnalyser()` FFT). **Notes:** `soundfont.ts` — sampled-first service (lazy `import('smplr')`, velocity,
  oscillator fallback). Always `releaseAll` on blur/unmount.
- **Scores:** the alphaTab `ScoreEngine` (`score/`). One engine, gotchas in `.claude/rules/scores.md`.
- **Pixi:** scenes + the `PixiCanvas` boundary (`pixi/`). Rules in `.claude/rules/pixi.md` — accessible
  fallback mandatory, `useThemeColors()` not `var(--token)`, NOT in optimizeDeps.
- **Drills:** engine + generators (`drills/`). A deck is a pure `DrillItemGenerator` — author via the
  **`author-content`** skill (drills reference). Server stores only SM-2 scheduling.
- **Chord data:** `music-theory.ts` `CHORDS` is the quality source of truth. `chord-shapes` (curated grips
  + `ChordShape` with optional `fingers`/`barres`), `chord-library` (generative CAGED shapes),
  `chord-voicings.generated.ts` (imported from MIT `@tombatossals/chords-db` via `scripts/import-chords.mjs`
  — `pnpm chords:import`), and the `chord-voicings.ts` `voicingsFor()` resolver (imported→generator; kept
  separate so the big dataset only loads for the dictionary). `piano-voicings.ts` builds keyboard
  voicings/inversions. SVG renderers live in `musickit-ui/organisms` (`ChordDiagram`,
  `KeyboardChordDiagram`). See `docs/features/chord-library.md` + ADR 0043.

## Tests

Pure logic + simple components run under this package's own Vitest (`reactPreset`, happy-dom). Components
that hit the duplicate-React optimizer (Pixi, `smplr` hooks) are covered by **E2E in `apps/web`**, not here
(ADR 0033). See `.claude/rules/testing.md`.
