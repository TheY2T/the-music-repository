# Feature: Interactive tools

- **Phase:** 3 (Slices A–B) · **Status:** shipped
- **Flag keys:** `tools.keyboard`, `tools.fretboard`, `tools.circle-of-fifths`, `tools.chords` (from
  `@TheY2T/tmr-flags`). Default on.

## Purpose

Client-side, audible music-theory tools — the interactive layer. More (scale explorer, reverse tools,
trainers) drop into the same `/tools` hub behind their own flags.

## UX behaviour

- `/tools` — hub listing the tools whose flag is on.
- `/tools/keyboard` — a two-octave **interactive piano**: click any key to hear it (Web Audio) and see
  the note name; a **Show note names** toggle; a **root + scale** picker that highlights the scale's
  keys (e.g. C major lights every white key).
- `/tools/fretboard` — an **interactive guitar fretboard** (standard tuning, frets 0–15): click a fret
  to hear it; a root + scale picker shows the scale's **shapes** with root notes emphasised; fret-marker
  inlays and a **Show note names** toggle.
- `/tools/circle-of-fifths` — an **interactive SVG circle**: 12 major keys (outer) + relative minors
  (inner); click a key to hear its tonic and show its **signature**, **relative minor**, and the seven
  **diatonic chords** (I–vii°).
- `/tools/chords` — a **chord builder**: pick a root + quality (triads, 7ths, sus, dim) → the chord's
  **notes with scale-degree labels** + formula; **Play chord** (block) / **Arpeggiate**.
- Every tool page renders the **Info View** (Phase 2) and tags terms with `data-help` (e.g. "Highlight
  scale" → `scales`, "Chord type" → `chords`), so the tools contribute to the same contextual glossary.

## Architecture

No backend — everything is computed in the browser (no API, no DB):

- `apps/web/src/lib/music-theory.ts` — pure 12-TET helpers: note names, `midiToFrequency`, scale
  formulas, circle-of-fifths table + `diatonicChords`, guitar tuning, chord formulas + `intervalLabel`.
- `apps/web/src/lib/audio.ts` — a dependency-free Web Audio note player (triangle osc + soft envelope;
  resumes the context on the first user gesture).
- Islands `PianoKeyboard.tsx`, `GuitarFretboard.tsx`, `CircleOfFifths.tsx`, `ChordBuilder.tsx`
  (client:load). Flag-gated pages redirect to `/tools` when their tool is off.

## Tests

- **Web (browser):** keyboard renders 24 keys (14 white + 10 black); clicking C4 sets "Last note: C4";
  root C + Major highlights exactly the seven white keys. Fretboard renders 6×16 (open EADGBE); A minor
  pentatonic highlights exactly A C D E G with root A emphasised, and the low-E string hits frets
  0·3·5·8·10·12·15. Circle defaults to C (no sharps/flats, rel. minor Am, chords C Dm Em F G Am B°);
  clicking A → 3 sharps / F♯m / A Bm C♯m D E F♯m G♯°. Chord builder: C Major → C E G (R·3·5); D Dominant
  7th → D F♯ A C (R·3·5·♭7); Play/Arpeggiate run without error. All music-theory outcomes correct.
