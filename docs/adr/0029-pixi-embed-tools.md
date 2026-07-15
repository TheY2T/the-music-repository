# ADR 0029 — Fit-for-purpose Pixi tools for catalogue embeds

- **Status:** accepted — `strum`, `chord-board`, `rhythm`, `intervals` shipped & browser-verified and
  their ASCII converted; `fingering` (fretboard charts) is the last tool, being built to the same pattern.
- **Date:** 2026-07-15
- **Builds on:** ADR 0028 (content embeds), ADR 0022 (PixiJS layer), ADR 0021 (themes).

## Context

After ADR 0028 replaced tool-shaped ASCII (fretboards, chord grids, scale tables) with inline
interactive embeds, catalogue articles still carried ~42 **static ASCII example blocks** — strum/picking
patterns, rhythm/note-value grids, chord/degree tables, interval tables, fingering charts — that no
existing tool covered. The decision was to upgrade **all** of them into interactive tools, rendered with
**PixiJS** (the app's WebGL layer, ADR 0022), and built **fit-for-purpose** — one small,
single-responsibility component per visual, not one configurable god object.

## Decision

**A family of focused Pixi visualisations, each an embed `tool`.** Each is a `lib/pixi/<name>-scene.tsx`
(the presentational Pixi scene — `@pixi/react` `Application`/`extend`/`useTick`, themed via
`useThemeColors`, sized via `ResizeObserver`) behind the existing `PixiCanvas` client-only boundary
(SSR/WebGL fallback, lazy-loaded, accessible DOM control set), wrapped by a small island
(`components/<Name>.tsx`) that owns state + audio. The island is added to the `ContentEmbeds` registry
under a new `tool` id. This keeps the **SOLID split**: scene = render, island = logic/audio, boundary =
lifecycle/fallback — no shared mega-component.

The tool set (maps the 42 ASCII blocks):

| `tool` | Scene | Replaces |
|---|---|---|
| `strum` ✅ | `strum-scene` | strum & picking patterns (↓↑· over beats) |
| `chord-board` ✅ | `chord-board-scene` | chord / degree / quality / cadence tables (tap to hear) |
| `rhythm` ✅ | `rhythm-scene` | note-value grids (blocks sized by duration) |
| `intervals` ✅ | *(reuses `chord-board-scene`)* | interval ↔ semitone tables (tap to hear) |
| `fingering` | *(planned)* | bass/uke fingering charts |

Genuinely tabular reference (chord-symbol glossaries, figured bass, mode-character, order-of-sharps,
cadence-comparison, fingering charts pending the tool) was converted from ASCII fences to **themed
Markdown tables** — no tool where none teaches, but no ASCII either. `intervals` reuses the
`chord-board-scene` card-row (a shared presentational primitive — the audio logic differs per island),
which is reuse, not a god object. A pure chord parser (`parseChordSymbol`/`chordToMidi`, `lib/embeds.ts`)
and note-value helpers (`lib/rhythm.ts`) are unit-tested.

All five `tool` ids + the `pattern`/`labels`/`tempo` embed fields are in the spec-first `ContentEmbed`
model (`main.tsp` → `spec:generate`) and the build's `EMBED_TOOLS` allow-list, so articles can be
authored against any of them; the `ContentEmbeds` renderer maps the built ones (unbuilt → nothing, until
their scene lands).

## Consequences

- **`strum` shipped:** `lib/pixi/strum-scene.tsx` + `components/StrumPattern.tsx`; the island steps
  through one bar of cells at a tempo and strums the chord(s) via the shared note service, while the Pixi
  strip animates a play-head to the active cell (static under reduced motion), re-tinting with the theme.
  `ukulele-strumming-patterns` converted (4 ASCII grids → 4 inline `strum` tools); verified rendering +
  play across the vintage themes.
- **Reference pattern** for the remaining four: copy `strum-scene` + `StrumPattern`, add the `tool`'s
  registry case + `embed.<tool>` i18n title, convert the matching ASCII. Documented in the `embed-tool`
  skill.
- **Boundaries:** Pixi is WebGL + client-only (`PixiCanvas`, never SSR) and stays out of `optimizeDeps`
  (ADR 0022). A no-WebGL viewer gets the accessible DOM fallback. Inline `score` embeds still validate via
  `scores:validate`; Pixi embeds are proofed in the browser.
