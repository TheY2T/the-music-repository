# Feature: Chord library

- **Phase:** expansion · **Status:** shipped
- **Flag key:** `tools.chord-dictionary` (the browsable dictionary tool). The underlying data +
  organisms are always-on shared infrastructure (no flag).

## Purpose

The chord library is the shared source of truth behind every harmony surface — chord diagrams, the
CAGED explorer, the voicing library, progression tools, the analyzer, and the chord-quality drill. It
provides: the chord *qualities* (theory), the fretted *voicings* (guitar/ukulele/bass diagrams) and the
keyboard *voicings/inversions* (piano), plus a browsable dictionary to look any chord up and hear it.

## Data model (all in `@TheY2T/tmr-music-core`)

- **Theory — the single source of truth:** `music-theory.ts` `CHORDS` (`ChordDefinition`:
  `key`/`name`/`intervals`/`symbol`/`aliases`/`level`/`category`/`tags?`). 32 qualities from triads to
  power chords, sixths, sevenths, extended and altered dominants. `SYMBOL_BY_QUALITY` derives display
  suffixes from this table; `chord-library.ts` and the parsers read from it (no duplication).
- **Fretted voicings:** `chord-shapes.ts` `ChordShape` (`frets` absolute, optional `fingers`/`barres`)
  + curated open grips. `chord-library.ts` generates movable CAGED shapes. `chord-voicings.generated.ts`
  is imported from the MIT `@tombatossals/chords-db` (see `scripts/import-chords.mjs`,
  `THIRD_PARTY_NOTICES.md`) — ~1,300 guitar + ~1,300 ukulele real-world voicings with fingering + barre
  data. `chord-voicings.ts` `voicingsFor(root, quality, instrument)` prefers the imported catalogue and
  falls back to the generator; it is isolated from `chord-library` so the sizeable dataset only loads for
  the dictionary, not every chord embed.
- **Piano voicings:** `piano-voicings.ts` `buildPianoVoicings(rootMidi, intervals)` → root position,
  inversions (up to the 3rd), and drop-2/drop-3/shell/open re-voicings, each with an `inversion` index.
- **Slash chords:** `embeds.ts` `parseChordFull`/`parseChordSymbol`/`chordToMidi` parse a `/bass` note
  (e.g. `C/G`) without mistaking the `6/9` suffix for a slash.

## UX behaviour

- **Rendering organisms** (`@TheY2T/tmr-musickit-ui/organisms`): `ChordDiagram` draws fretboard shapes,
  now with finger numbers inside the dots and a barre bar across held strings when the data carries them.
  `KeyboardChordDiagram` (new) draws a compact keyboard sized to the voicing, highlights the tones, names
  them, and captions the inversion.
- **Chord dictionary tool** (`/tools/chord-dictionary`, `ChordDictionary` island): filter by instrument
  (guitar / ukulele / bass / piano) × root × quality × level. Browse mode shows one diagram per chord in a
  paginated grid (`usePagination` + `PaginationBar`); picking a specific root + type shows every voicing
  (fret positions or keyboard inversions). Tap any diagram to hear it.
- **Catalogue articles:** *The Essential Guitar Chords* (`guitar-chord-library`) and *Piano Chord Voicings
  & Inversions* (`piano-chord-voicings`) — prose + `chord-diagrams` embeds (guitar and the new `piano`
  instrument) that deep-link into the dictionary.
- **Embeds:** the `chord-diagrams` embed now accepts `instrument: "piano"`, rendering a row of tappable
  `KeyboardChordDiagram`s (`ContentEmbeds`).
- **Drills:** the `chord-quality` ear deck derives its cards from `chordsByLevel('intermediate')`, so new
  qualities (e.g. power chords) flow into it automatically as they are added to `CHORDS`.

## API contract

None. Chord data + tools are client-only; the catalogue articles use the existing content pipeline
(`content:build` → `seed-content.ts`) with base metadata in `seed-data.ts`.

## Tests

- **Unit** (`pnpm --filter @TheY2T/tmr-music-core test`): new qualities + Roman-numeral coverage
  (`music-theory.test.ts`); slash-chord + expanded-vocabulary parsing (`embeds.test.ts`); piano voicing
  inversions (`piano-voicings.test.ts`); the import resolver + power-chord fallback + chord-tone invariants
  (`chord-voicings.test.ts`, `chord-library.test.ts`); ear-deck auto-growth (`generators.test.ts`).
- **Component** (`pnpm --filter @TheY2T/tmr-musickit-ui test`): finger/barre rendering + keyboard diagram
  (`organisms/*.test.tsx`).
- **E2E** (`pnpm test:e2e`): the dictionary tool — browse, piano switch, and all-voicings detail view
  (`apps/web/e2e/chord-dictionary.spec.ts`).
- **Regenerate the imported voicings:** `pnpm --filter @TheY2T/tmr-music-core chords:import`.

## Follow-ups

- A visual **"name-that-chord-diagram"** MCQ drill deck (present a `ChordDiagram`/`KeyboardChordDiagram`,
  ask for the quality). Deferred: it needs a new `chord-diagram` `DrillPresentation` kind and the legacy
  drill-hub surfacing wiring; the ear deck already covers chords-in-drills for now.
