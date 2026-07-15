# ADR 0026 — Interactive score player (click/seek/loop; dual engine)

- **Status:** accepted (Phase 1 shipped; Phase 2 alphaTab built — needs live validation)
- **Date:** 2026-07-15

## Context

Scores were a one-shot, play-from-start experience (two twin islands, page-1-only render, raw
oscillator, no click/seek/loop). We want a practice-grade player — click a note to hear it, click a
note/bar to play from there, mark an **A–B loop** and drill it with **metronome + count-in** at an
adjustable **tempo**, with a **scrub bar**. Research (OSMD vs alphaTab vs Verovio) concluded Verovio
already exposes the note/bar↔time↔pitch graph and highlights with **zero re-render**, so the gap is
UI/state — not data.

## Decisions

1. **One shell, two engine adapters.** A single `ScorePlayer` island owns all UI + interaction state
   over a small `ScoreEngine` interface (`src/lib/score/score-engine.ts`); engines only render +
   transport → the two experiences stay at parity by construction.
2. **Verovio for piano, alphaTab for guitar** (`resolveEngine` in `src/lib/score/loop.ts`): piano-based
   (incl. piano+guitar) → Verovio (best engraving + native MusicXML + PDF export); fretted-only → alphaTab
   (built-in synth + looping + tab). An explicit per-score override is a future add (`ScoreMeta.engine`).
3. **`VerovioScoreEngine`** (`src/lib/score/verovio-engine.ts`) renders the **whole score** (all pages,
   scrollable), builds a note schedule + measure time-spans, and plays via the **sampled note service**
   (`soundfont.scheduleNote`, oscillator fallback) through a cancelable `createPlaybackBus`. Seek =
   `fromMs` offset; **A–B loop** = a lookahead scheduler that re-arms each pass seamlessly (visual cursor
   via `getElementsAtTime` + score-time modulo); metronome/count-in via `audio.scheduleClick`;
   click-to-hear + hit-testing via SVG ids (`svgBoundingBoxes` makes whole notes/bars clickable);
   highlight = CSS class on the SVG (no re-render).
4. **Sampled scheduled playback** — new `soundfont.scheduleNote(midi, atTime, dur, opts)` /
   `stopScheduled()` (smplr `start({time})`, tracked stoppers) so scores play real instruments, cancelable
   for stop/loop, falling back to `scheduleTone` when no soundfont is loaded.
5. **Flag** — `learning.interactive-scores`: **off** = basic play/stop/tempo; **on** = full
   click/seek/loop/scrub/metronome. Threaded to `ContentDetail` via the catalogue page.

## Status / consequences

- **Phase 1 (shipped):** the shared shell + Verovio engine + all interactions + sampled playback, wired
  into the catalogue detail pages; the old `ScoreViewer` twin is retired. `pnpm test/lint/build/check-types`
  green; runtime is E2E-only (dup-React/audio) and unverified until a container runtime + `pnpm test:e2e`.
- **Phase 2 (built, unverified):** `AlphaTabScoreEngine` (`src/lib/score/alphatab-engine.ts`) implements
  the same interface (`play`/`stop`/tempo/metronome/count-in via alphaTab's API, A–B loop via
  `playbackRange`+`isLooping` by bar tick, seek via `timePosition`, hit-test via `boundsLookup`,
  click-to-hear via our shared note service); `ScorePlayer` dynamic-imports it when
  `resolveEngine(instruments) === 'alphatab'`. **Caveats needing live validation:** alphaTab's official
  Vite plugin is broken in v1.8.4 (missing `dist/vite/`), so we load its Bravura font + sonivox soundfont
  from the pinned **CDN** (`ATAB_VERSION` must track the cataloged version); the audio worklet + CDN asset
  loading + guitar-score rendering fidelity (~52–62% MusicXML) are unverified without a running browser.
  The `SoundfontStatus`-style override (`ScoreMeta.engine`) can pin any poor render back to Verovio.
- **Still remaining:** migrating `/tools/score` (`ScoreRenderer`, textarea/upload input) onto the shell;
  E2E for both engine paths; the `ScoreMeta.engine` contract field.
