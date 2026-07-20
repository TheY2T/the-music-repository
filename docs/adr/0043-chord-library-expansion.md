# ADR 0043 — Chord library expansion (data sourcing, fingering/barre model, piano diagrams)

- **Status:** accepted
- **Date:** 2026-07

## Context

Chord data in `@TheY2T/tmr-music-core` was narrow and uneven: `music-theory.ts` `CHORDS` defined 26
qualities (missing common ones like the power chord and six-nine); the curated grips held a single voicing
per chord; the generative `chord-library.ts` covered ~14 guitar / 5 ukulele qualities and returned nothing
for many extended/altered chords; `ChordShape` modelled no finger numbers or barres; and piano had no
stored voicings or diagram renderer at all — keyboard voicings were computed inline in one UI component and
only ever *sounded*. We wanted broader, more accurate coverage across four axes (more qualities · more
voicings/positions · guitar↔piano parity · richer metadata) wired into the diagram tools, a browsable
dictionary, catalogue articles, and the drill engine.

## Decision

1. **Theory stays the single source of truth, widened.** New qualities (power `5`, six-nine `6/9`,
   `maj11`/`maj13`/`m11`/`m13`) join `CHORDS`, each with a `category` + `tags` for grouping/filtering.
   `SYMBOL_BY_QUALITY` is derived from `CHORDS`, replacing the duplicated suffix map in `chord-library.ts`;
   Roman-numeral lowercasing is derived from the quality key so a new minor/diminished quality is covered
   automatically.
2. **Voicings are sourced hybrid: import + curate, not hand-authored or a runtime pipeline.** A dev-time
   script (`scripts/import-chords.mjs`, `pnpm chords:import`) converts the MIT-licensed
   `@tombatossals/chords-db` into `chord-voicings.generated.ts` — absolute frets + `fingers` + `barres` for
   ~1,300 guitar and ~1,300 ukulele voicings across the 28 mapped qualities. The generated file is
   committed; the dependency is dev-only; attribution lives in `THIRD_PARTY_NOTICES.md`. This is **additive
   to the existing diagram UX** — same `ChordShape` render path, with a relative→absolute fret conversion
   done at import time.
3. **`ChordShape` gains optional `fingers` + `barres`.** The `ChordDiagram` SVG renderer draws finger
   numbers inside dots and a barre bar when present; shapes without them render exactly as before.
4. **The imported dataset is isolated behind a resolver.** `chord-voicings.ts` `voicingsFor()` (imported
   catalogue → generator fallback) lives in its own module so the ~260 KB dataset only bundles for the
   dictionary tool, not for every chord embed. `embeds.findChordShape` keeps its curated-then-generated
   path, so article pages stay light.
5. **Piano is first-class.** `piano-voicings.ts` `buildPianoVoicings` (extracted + generalized from the
   voicing tool) is the headless source for keyboard voicings/inversions; a new `KeyboardChordDiagram`
   organism renders them. The `chord-diagrams` embed accepts `instrument: "piano"`.
6. **A browsable chord dictionary** (`/tools/chord-dictionary`, flag `tools.chord-dictionary`) is the
   canonical browse surface, complemented by two catalogue articles that deep-link into it.

## Consequences

- Extended/altered guitar qualities and every piano chord now render instead of degrading to a text label;
  guitar and ukulele diagrams show real-world fingerings and barres.
- Regenerating or widening coverage is one command (`chords:import` after adjusting the suffix map); the
  committed generated file keeps runtime and CI free of the dependency.
- The generated dataset is large; keeping it behind `chord-voicings.ts` (never imported by the common embed
  path) prevents it from bloating catalogue pages. `.generated.ts` is excluded from Biome.
- Slash-chord parsing (`C/G`) is supported everywhere chord symbols are parsed, without breaking the `6/9`
  suffix.
- A visual "name-that-diagram" drill deck is left as a follow-up (needs a new `DrillPresentation` kind);
  the chord-quality ear deck already grows automatically with the theory table.

Supersedes nothing; extends the interactive-tools + content-embeds work (ADR 0025/0028) and follows the
port-naming (ADR 0012) and design-system (ADR 0018) conventions.
