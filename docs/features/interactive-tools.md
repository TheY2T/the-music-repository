# Feature: Interactive tools

- **Phase:** 3 (Slices A–F) · **Status:** shipped
- **Flag keys:** one `tools.*` flag per tool — `tools.keyboard`, `tools.fretboard`,
  `tools.circle-of-fifths`, `tools.chords`, `tools.scale-explorer`, `tools.chord-id`, `tools.modes`,
  `tools.progression`, `tools.metronome`, `tools.tuner`, `tools.intervals`, `tools.staff` (from
  `@TheY2T/tmr-flags`). Default on.

## Purpose

Client-side, audible music-theory + practice tools — the interactive layer. More (ear-training drills,
staff notation) drop into the same `/tools` hub behind their own flags.

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
- `/tools/scale-explorer` — pick a root + scale → its **notes with scale-degree labels**, the
  **whole/half step pattern** (e.g. major = W–W–H–W–W–W–H), and **Play ascending**.
- `/tools/chords` — a **chord builder**: pick a root + quality (triads, 7ths, sus, dim) → the chord's
  **notes with scale-degree labels** + formula; **Play chord** (block) / **Arpeggiate**.
- `/tools/chord-identifier` — a **reverse lookup**: toggle pitch classes → the matching chord name(s).
  Inversion-aware (matches the pitch-class set, not the bass).
- `/tools/modes` — a **mode explorer**: pick a root → all seven modes (Lydian → Locrian, bright to dark)
  with their notes and **characteristic note**; play each.
- `/tools/progression` — a **Roman-numeral progression builder**: pick a key → click diatonic chords to
  build a progression; see the **Roman-numeral sequence** (e.g. I–V–vi–IV) + names; play it.
- `/tools/metronome` — an **accented metronome** using a Web Audio **lookahead scheduler** (sample-
  accurate timing); adjustable BPM + beats-per-bar with a visual beat indicator.
- `/tools/tuner` — a **tuning reference**: sustained tones for A440 and the six guitar strings
  (E2–E4) with their exact frequencies, to tune by ear.
- `/tools/intervals` — an **interval explorer**: pick a lower note + interval → the two notes + full
  interval name; play **melodic** or **harmonic**.
- `/tools/staff` — a **staff note reader**: an SVG **treble staff** (with clef + ledger lines) of the
  natural notes C4–C6; click a note to hear and name it.
- Every tool page renders the **Info View** (Phase 2) and tags terms with `data-help` (e.g. "Highlight
  scale" → `scales`, "Chord type" → `chords`), so the tools contribute to the same contextual glossary.

## Architecture

No backend — everything is computed in the browser (no API, no DB):

- `apps/web/src/lib/music-theory.ts` — pure 12-TET helpers: note names, `midiToFrequency`, scale
  formulas + `stepPattern`, circle-of-fifths table + `diatonicChords`, guitar tuning, chord formulas +
  `intervalLabel`, and `identifyChords` (reverse notes→chord across all roots/inversions).
- `apps/web/src/lib/audio.ts` — a dependency-free Web Audio note player (triangle osc + soft envelope;
  resumes the context on the first user gesture).
- `MODES` (seven modes + characteristic note) and `diatonicChords` (now with playable `pitchClasses`).
- Islands `PianoKeyboard.tsx`, `GuitarFretboard.tsx`, `CircleOfFifths.tsx`, `ChordBuilder.tsx`,
  `ScaleExplorer.tsx`, `ChordIdentifier.tsx`, `ModeExplorer.tsx`, `ProgressionBuilder.tsx`
  (client:load). Flag-gated pages redirect to `/tools` when their tool is off.

## Tests

- **Web (browser):** keyboard renders 24 keys (14 white + 10 black); clicking C4 sets "Last note: C4";
  root C + Major highlights exactly the seven white keys. Fretboard renders 6×16 (open EADGBE); A minor
  pentatonic highlights exactly A C D E G with root A emphasised, and the low-E string hits frets
  0·3·5·8·10·12·15. Circle defaults to C (no sharps/flats, rel. minor Am, chords C Dm Em F G Am B°);
  clicking A → 3 sharps / F♯m / A Bm C♯m D E F♯m G♯°. Chord builder: C Major → C E G (R·3·5); D Dominant
  7th → D F♯ A C (R·3·5·♭7). Scale explorer: C Major → C D E F G A B, step pattern W–W–H–W–W–W–H. Chord
  identifier: C·E·G → C Major; C·E·G·A → A Minor 7th (inversion-aware). Mode explorer: C root → 7 modes
  Lydian→Locrian with correct notes (e.g. C Dorian = C D E♭ F G A B♭, ♮6). Progression builder: C key,
  clicking I·V·vi·IV → "I(C) – V(G) – vi(Am) – IV(F)". All music-theory outcomes correct.
