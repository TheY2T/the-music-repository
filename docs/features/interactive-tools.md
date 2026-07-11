# Feature: Interactive tools

- **Phase:** 3 (Slice A) · **Status:** shipped
- **Flag keys:** `tools.keyboard`, `tools.circle-of-fifths` (from `@TheY2T/tmr-flags`). Default on.

## Purpose

Client-side, audible music-theory tools — the interactive layer. This slice ships the two most iconic
tools; more (fretboard, scale/chord explorers, trainers) drop into the same `/tools` hub behind their
own flags.

## UX behaviour

- `/tools` — hub listing the tools whose flag is on.
- `/tools/keyboard` — a two-octave **interactive piano**: click any key to hear it (Web Audio) and see
  the note name; a **Show note names** toggle; a **root + scale** picker that highlights the scale's
  keys (e.g. C major lights every white key).
- `/tools/circle-of-fifths` — an **interactive SVG circle**: 12 major keys (outer) + relative minors
  (inner); click a key to hear its tonic and show its **signature**, **relative minor**, and the seven
  **diatonic chords** (I–vii°).
- Both pages render the **Info View** (Phase 2) and tag terms with `data-help` (e.g. "Highlight scale"
  → `scales`, "Diatonic chords" → `chords`), so the tools contribute to the same contextual glossary.

## Architecture

No backend — everything is computed in the browser (no API, no DB):

- `apps/web/src/lib/music-theory.ts` — pure 12-TET helpers: note names, `midiToFrequency`, scale
  formulas, the circle-of-fifths table, and `diatonicChords`.
- `apps/web/src/lib/audio.ts` — a dependency-free Web Audio note player (triangle osc + soft envelope;
  resumes the context on the first user gesture).
- Islands `PianoKeyboard.tsx`, `CircleOfFifths.tsx` (client:load). Flag-gated pages redirect to `/tools`
  when their tool is off.

## Tests

- **Web (browser):** keyboard renders 24 keys (14 white + 10 black, correctly positioned); clicking C4
  sets "Last note: C4"; selecting root C + Major highlights exactly the seven white keys. Circle
  defaults to C major (no sharps/flats, rel. minor Am, chords C Dm Em F G Am B°); clicking **A** updates
  to 3 sharps / rel. minor F♯m / chords A Bm C♯m D E F♯m G♯°. Both music-theory outcomes are correct.
