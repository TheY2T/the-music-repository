# ADR 0027 — Unify score rendering on alphaTab (replace Verovio)

- **Status:** accepted (catalogue + `/tools/score` + `/tools/musicxml` shipped & browser-verified;
  note-array tool consolidation deferred — see Consequences)
- **Date:** 2026-07-15
- **Supersedes:** the dual-engine decision in [ADR 0026](0026-interactive-score-player.md) and the
  MusicXML-as-source decision in [ADR 0024](0024-score-content-pipeline.md).

## Context

ADR 0026 shipped a practice-grade `ScorePlayer` over a `ScoreEngine` interface with **two** engines —
**Verovio** for piano, **alphaTab** for guitar (the alphaTab path built but never validated). That
split cost us two rendering/playback stacks, a bespoke lookahead sampled-playback scheduler for the
Verovio path, and drift: `/tools/score` ran its own Verovio instance, `/tools/musicxml` hand-rolled a
DOMParser + SVG staff, and a dozen tool components hand-authored music as note-name/beat arrays or
fret data. alphaTab renders **both** standard notation (piano grand staff) and tablature (guitar) and
ships its own synth, playback cursor, A–B loop, metronome, and count-in — so one engine can replace
the whole split and delete most of the custom playback code.

## Decisions

1. **alphaTab is the single engine.** `AlphaTabScoreEngine` (`apps/web/src/lib/score/alphatab-engine.ts`)
   implements a slimmed `ScoreEngine` (`score-engine.ts`); Verovio (`verovio-engine.ts`, `verovio.d.ts`,
   the Pixi notation-playhead, the `verovio` dependency in both apps + the catalog) is **deleted**.
2. **Two display modes, one component, one interaction model.** `resolveDisplayMode(instruments)`
   (`loop.ts`) picks `standard` (piano — `StaveProfile.Score`) or `tab` (guitar — `StaveProfile.Default`,
   notation + tablature). Both modes share the **same** integrated media-player bar and interaction: the
   shell owns everything (`enableUserInteraction: false` for both — alphaTab's native selection UI is
   off) so piano and guitar behave identically. Bar: to-start / play-pause / stop / scrub, tempo,
   **A–B selection** (click-and-drag across the score to select a **beat-precise** passage — can
   start/end mid-bar, live-highlighted with a "Selected bar(s) X–Y" readout; **Play then plays just that
   passage and stops at its end**, re-cued to its start), metronome, count-in, print, click-to-hear,
   click-to-seek. The loop actions live in a **right-click contextual menu** (Play selection / Loop
   selection / Clear selection, or Loop whole piece when nothing is selected) — there is no inline Loop
   button; the drag-to-select hint points users to right-click. A per-score `ScoreMeta.displayMode`
   overrides the mode. **Auto-tab:** the
   scores are *pitched* (not fretted), so for `tab` mode the engine makes each staff stringed at load —
   `tabTuningFor(instruments)` (`loop.ts`) supplies the standard guitar/bass/ukulele tuning, and the
   engine assigns every note a string/fret (lowest-playable-fret heuristic), accounting for the
   octave transposition of guitar/bass (written 8va above sounding; ukulele is at pitch).
3. **alphaTab's synth drives playback.** Cursor, section loop (`highlightPlaybackRange` +
   `applyPlaybackRangeFromHighlight` + `isLooping`), speed (`playbackSpeed`), metronome/count-in
   volumes, click-to-seek (`hitTest`→`tickPosition`) are all native. Selections/loops are
   **beat-precise** — the shell tracks a mouse drag, `hitTest` maps the start/end points to beat onset
   ticks (`orderTicks`), the engine draws the selection live (`highlightRange`) and, on release,
   `applyRange` resolves the ticks back to beats via a `beatsByTick` index →
   `highlightPlaybackRange`+`applyPlaybackRangeFromHighlight` (bounding playback, cursor cued at the
   start), so a passage can begin/end mid-bar. Bounded-but-not-looping = Play plays the passage once and
   stops (`onEnded` re-cues the start); `setLooping(true)` makes it repeat; `clearRange` restores the
   whole piece. Notation is lazy-rendered (`ScrollMode.Continuous`) so an off-screen score paints when
   scrolled to. The
   shared **smplr** sampled note service is kept only for click-to-hear one-shots (warmer than the synth)
   and the keyboard tool. Print-to-PDF = `api.print()` (replaces Verovio's bespoke PDF export).
4. **alphaTex is the canonical score format.** The 55 hand-authored MusicXML scores were converted —
   **losslessly and automatically** — through alphaTab's own importer/exporter
   (`scores:migrate` = `musicxml-to-alphatex.mjs`) to `content/scores/<slug>.alphatex` (+ the existing
   `.meta.json`). `scores:build` bundles `SCORE_ALPHATEX` into `seed-scores.ts`; `scores:validate`
   re-parses each alphaTex via alphaTab; the seed uploads an **`alphatex`** media asset (was `musicxml`).
   `MediaKind` in the TypeSpec spec gains `alphatex` (drops `midi`/`musicxml`).
5. **Self-hosted assets, no CDN.** The `@coderline/alphatab-vite` plugin (the main package's `/vite`
   subpath is broken in 1.8.4) copies the Bravura font → `/font` and SONiVOX soundfont →
   `/soundfont/sonivox.sf2`; the engine points at those. alphaTab is pinned to an **exact** version so
   the served assets match the runtime, is a **client-only** island (Web Worker + AudioWorklet), and is
   **not** in `optimizeDeps` (dup-React caveat, like pixi).
6. **Theme-driven notation colors.** alphaTab glyph colors aren't CSS-reactive, so `use-alphatab-theme.ts`
   reads the semantic tokens (per aesthetic × light/dark, ADR 0021) as hex and applies them via
   `display.resources` + re-render on theme change (mirrors the Pixi `useThemeColors` bridge). The
   cursor + A–B selection overlays are plain DOM, themed via `.at-cursor-*` / `.at-selection` CSS —
   a plain selection uses `--primary`; once looped (`data-looping` on the container) it switches to
   `--accent` so an active loop is visually distinct from a pending selection.
   The right-click menu reuses the design-system `DropdownMenu` (extended with controlled
   `open`/`onOpenChange` + a `style` passthrough so it can anchor `position: fixed` at the pointer);
   its `z-index` must exceed alphaTab's own cursor/selection layer (`.at-cursors`, `z-index: 1000`),
   which otherwise paints over the opaque menu and makes it look translucent — the menu uses `z-index: 2000`.
7. **"rendered by alphaTab" footer removed.** alphaTab draws an ungated footer annotation; a
   `MutationObserver` hides that SVG text as partials are appended. MPL-2.0 doesn't require it and we
   keep source attribution in the score credit line.
8. **Drift consolidated (real-score surfaces).** `/tools/score` (`ScoreRenderer`) and `/tools/musicxml`
   (`MusicXmlImport`) are rebuilt as thin editors over `ScorePlayer` (it gained a `tex` prop for inline
   sources); the hand-rolled Verovio + DOMParser paths are gone. The `learning.interactive-scores` flag
   is unchanged.

## Status / consequences

- **Shipped & browser-verified:** catalogue piano (Ode to Joy, standard notation) + guitar (Lágrima),
  bass, and ukulele (standard notation **+ tablature** with correct tunings) render + play on alphaTab;
  `/tools/score` (alphaTex playground, standard/tab toggle) + `/tools/musicxml` (MusicXML import) render
  via alphaTab; watermark gone; Play/Pause/tempo/loop/scrub work; assets served locally. 55/55 scores
  convert + validate; `pnpm test`/`check-types` green (web 76, api 141). Engine runtime stays E2E-only
  (Worker/AudioWorklet don't run under happy-dom); pure helpers (`resolveDisplayMode`, `tabTuningFor`,
  tick loop reducer) are unit-tested.
- **Auto-tab accuracy:** frets are auto-assigned from pitch (lowest-playable position), so they render
  as correct, playable tab but not necessarily the composer's original fingering. A score can pin exact
  fingerings by authoring its `.alphatex` with `fret.string` notation (see the `add-score` skill).
- **Deferred — note-array/tab tools.** ~11 bespoke tools hand-author notation as note-name/beat arrays
  or fret data via the `StaffSequence` SVG primitive (NotationPlayer, SongPlayer, LickLibrary; the
  SightReading/Melodic/Rhythm/Solfège/ScaleBoxes/ScaleExplorer/MultiVoice generators; chord/fret grids).
  They do **not** use Verovio, so removing it didn't require touching them. Consolidating them onto
  alphaTab is a large, separable effort where alphaTab is a **weaker fit** (dynamically-generated
  exercises, fingering-position grids that aren't staff notation). Recommended pattern when picked up: a
  shared `notes→alphaTex` generator + an `AlphaTexScore` island, keeping each tool's generation/
  answer-checking/reveal logic and its interactive fret grid. Evaluate per tool; migrate the fixed-tune
  notation tools first (NotationPlayer/SongPlayer/LickLibrary).
