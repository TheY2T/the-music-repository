# Interactive Tools Audit — Expansion & Consolidation

_Date: 2026-07-15 · Scope: every interactive learning/practice tool in `apps/web` + the theory/content data that feeds them._

This audit inventories the current tool surface, identifies where the tools are throttled, and lays
out a prioritized plan to **(1) deepen** existing tools, **(2) consolidate** overlapping ones,
**(3) grow content & play-along**, and **(4) add new tools**. It complements `docs/backlog.md`
(which is a feature parking-lot) with a data-and-consolidation lens.

> **Status (2026-07-15).** The **deepen** + **consolidate** + **level-tier** work is complete on branch
> `feat/tools-theory-expansion`: unified/expanded theory tables (scales 9→20, chords 10→26), the
> generative movable chord-shape library (+ bass) wired into the CAGED explorer & chord-diagrams
> dictionary, bass clef + key signatures for the reading tools, the Beginner→Expert level selector
> (X1), and consolidations C1 + C5 (C2/C3/C4/C6 deliberately kept separate — see §3). The tuner's mic
> pitch-detection was already shipped. **Expansion started:** the **improvise guide** (§6,
> `/tools/improvise`), the **progression generator** (`/tools/progression-generator`), the **fretboard
> note game** (`/tools/fret-game`), the **note-reading game** (`/tools/staff-game`), the **piano & guitar
> map** (`/tools/scale-map`), the **rhythm tap game** (`/tools/rhythm-game`), a widened instrument menu
> (§5, 10→36 GM voices) and **live embeds on every catalogue article** (§5, density 25→**83/83**) are
> shipped. Remaining §5/§6 is genre/difficulty content + heavier tools (practice planner). Workspace
> `pnpm lint` green.

> **Design principle threaded throughout — Level tiers.** Every tool should expose a
> **Beginner / Intermediate / Advanced (/ Expert)** selector that gates which options are visible and
> pre-fills sensible defaults, so a beginner sees C-major triads and a jazz player sees altered
> dominants — the same tool, progressively disclosed. This is a cross-cutting requirement, tracked as
> item **X1** below, and referenced from each family.

---

## 1. The headline finding: three tables gate everything

All ~50 tools are client-side and share one theory engine. Their ceiling is set by **three small
hardcoded tables**. Lift these and nearly every tool gets richer for free.

| Table | File | Current | Feeds |
|---|---|---|---|
| `SCALES` | `apps/web/src/lib/music-theory.ts` | **9** scales | keyboard, fretboard, scale-boxes, scale-explorer, fingering, modes, ear/quiz tools |
| `CHORDS` | `apps/web/src/lib/music-theory.ts` | **10** qualities | chord builder, identifier, voicings, analyzer, progression, all play-along |
| `GUITAR_CHORDS` / `UKULELE_CHORDS` | `packages/ui/src/components/organisms/music/chord-diagram.tsx` | **16 / 11** static open-position shapes | chord-diagrams, chord-board, strum, progression-player, song, practice-room |

**Critical inconsistency (fix first):** `apps/web/src/lib/embeds.ts` already defines a *separate,
richer* chord vocabulary (`QUALITY_INTERVALS`, ~20 qualities incl. `m7♭5/ø`, `6`, `m6`, `Δ`) that the
core `CHORDS` table lacks. Two sources of truth for "what chords exist" is both a consolidation bug
and a signpost: the richer parser should be promoted into `music-theory.ts` as the single source, and
`embeds.ts` should consume it.

---

## 2. Current tool inventory (by family)

53 interactive surfaces: 48 `/tools/*` routes, 4 `/drills` decks, 5 embed-only Pixi cards, plus the
score player. Grouped below with each family's shared code and coverage ceiling.

- **A. Keyboard / fretboard** — keyboard, soundfont, fretboard, chord-diagrams, caged, scale-boxes, voicings, fingering (embed)
- **B. Theory / harmony** — circle-of-fifths, scale-explorer, chords, chord-identifier, modes, progression, intervals, analyzer, transposer
- **C. Ear-training / quiz** — ear-trainer, progression-ear, chord-quality-ear, fret-quiz, melodic-dictation, rhythm-dictation, solfege, key-quiz, interval-quiz + 4 SRS decks
- **D. Rhythm / time** — metronome, tuner, sequencer, rhythm, grooves
- **E. Reading / notation** (alphaTab) — score, musicxml, multi-voice, player, sight-reading, staff
- **F. Play / practice** — backing-track, licks, strumming, fingerpicking, arpeggio, progression-player, practice-player, practice-room, bassline, song
- **G. Embed-only Pixi cards** — strum, chord-board, rhythm, intervals, fingering

_(Full per-tool detail with file paths, params, and limitations is in the appendix at the end.)_

---

## 3. Consolidation plan

Overlaps waste maintenance effort and confuse the tool hub. Recommended merges, safest first:

| # | Merge | Rationale | Effort |
|---|---|---|---|
| C1 | ✅ **DONE (2026-07-15)** **keyboard + soundfont merged** — the keyboard tool now shows both the scale highlighter and the instrument picker; `/tools/soundfont` redirects to it and the duplicate hub card is removed (flag/i18n left intact). | XS |
| C2 | ⏸️ **RESOLVED — keep separate (2026-07-15).** Route-tool vs embed-Pixi "pairs" (`intervals`, `rhythm`, `strum/strumming`, `chord-diagrams/chord-board`) are not true duplicates: the route tools are full playgrounds; the embed cards are compact, preconfigured, in-article surfaces (often Pixi). They serve different contexts and already share the underlying theory/audio + `findChordShape`. Folding one into the other would either bloat the embed or strip the tool. | M |
| C3 | ⏸️ **RESOLVED — keep separate (2026-07-15).** Fretboard family (`fretboard`/`scale-boxes`/`caged`/`fingering`). They already share the Pixi `fretboard-scene` + `music-theory`; each is a *focused study tool* (free explore / movable box / CAGED / embed fingering). A mode-switch mega-tool trades that focus for complexity and risks 4 regressions for no real code win — the shared code is already factored. | L |
| C4 | ⏸️ **RESOLVED — keep separate (2026-07-15).** Band family (`backing-track`/`practice-room`/`bassline`/`grooves`). The shared engine (`scheduleTone`/`scheduleDrum` lookahead scheduler) already lives in `audio.ts`; each tool has distinct arrangement logic + study focus (full band / practice-with-diagram / bass styles / drum grooves). Merging is a UX regression, not a dedup. | L |
| C5 | ✅ **DONE (2026-07-15)** score + musicxml merged — the playground has an alphaTex/MusicXML input-format toggle (the engine sniffs by leading `<`); `/tools/musicxml` redirects, its card + `MusicXmlImport` removed. | S |
| C6 | ⏸️ **RESOLVED — keep separate (2026-07-15).** The 4 SRS decks and the standalone quizzes already share the primitives that matter (`playTone`, `midiToFrequency`, `CHORDS`, `INTERVAL_NAMES`); each deck's `play`/`answer` is ~15 lines. They differ in session model (SM-2 scheduling vs one-off scoring). A shared "question bank" would touch the SRS flow for negligible dedup. | M |

> Consolidation goal: fewer *implementations*, not fewer *entry points*. The two genuine redundancies
> (**C1** identical component, **C5** thin duplicate editors) were merged with route redirects so no links
> break. **C2/C3/C4/C6** were reviewed and deliberately kept separate: their shared code is already
> factored into `audio.ts` / the Pixi scenes / `music-theory` / chord exports, and collapsing focused
> single-purpose tools into configurable mega-tools would degrade UX and risk regressions for no real gain.

---

## 4. Deepen existing tools

Ordered by leverage. Items marked **[foundation]** unlock multiple downstream tools.

### 4.1 [foundation] Expand the theory tables
- **Scales:** add melodic-minor, the 3 remaining church modes as selectable scales (phrygian/lydian/locrian), whole-tone, diminished (H-W & W-H), bebop (dominant/major), Hungarian/Spanish/other exotic sets. → lifts keyboard, fretboard, scale-boxes, scale-explorer, modes, fingering, ear/dictation tools.
- **Chords:** add half-diminished (m7♭5), 6/m6, add9, 9/11/13, dominant alterations (7♭9/♯9/♯11/♭13), maj9/13, quartal. Promote `embeds.ts` `QUALITY_INTERVALS` into `music-theory.ts` as the single source. → lifts chord builder, identifier, voicings, analyzer, progression, all play-along.
- **Minor-key & borrowed-chord harmony:** `diatonicChords`/`analyzeChordInKey` are major-key only. Add minor-key diatonic sets + a fuller borrowed-chord/secondary-dominant vocabulary. → analyzer, progression, progression-ear, backing-track.

### 4.2 [foundation] Generative movable chord-shape library
Replace the 16 static guitar shapes with a **CAGED-based movable-shape generator**: given a chord
symbol + instrument + tuning, produce playable voicings anywhere on the neck (barre + open). Add a
proper **bass** shape set (currently zero). → chord-diagrams, chord-board, strum, progression-player,
song, practice-room, and CAGED (which becomes minor/7th-capable, not major-only).

### 4.3 Alternate tunings everywhere
`STANDARD_TUNING` is hardwired for the fretboard route. Add drop-D, DADGAD, open-G/D, 7/8-string, and
expose the tuning selector (already present for the `fingering` embed) on every fretted tool.

### 4.4 Tool-specific deepening (high-value picks)
- **Tuner** → add **microphone pitch-detection** (autocorrelation/YIN) so it tunes, not just references. The Pixi audio-analyser bus already exists (used by the visualizer). **[high value]**
- **Staff reader / sight-reading** → add **bass clef, accidentals, key signatures, and multiple keys** (both are naturals-only / C-major-only today). Feeds a far richer reading curriculum.
- **Sequencer** → configurable track count + steps, more kit pieces, save/share patterns, swing.
- **Voicing library** → guitar/fretted voicings (currently keyboard-only), drop-2/4, spread triads, rootless jazz voicings — unlocked by 4.1/4.2.
- **Ear-trainer** → chord-progression & scale-degree modes, adjustable difficulty ranges, MIDI answer everywhere (hook already exists).
- **Metronome** → programmable bar sequences / setlist tempos, accent patterns per subdivision (subdivisions + polyrhythm + tap already shipped).
- **Circle of fifths** → toggle minor-key ring, modal wheel, secondary-dominant spokes, and "chords in this key" playback per slice.

---

## 5. Content & play-along expansion

The catalogue is **classical-piano-heavy** (39 of 93 items classical; jazz/rock/pop are one-offs) and
only **25 of 83 articles use live embeds**.

- **Genre breadth:** author public-domain **blues, ragtime, folk, early-jazz** scores + companion
  articles (jazz standards are copyright-blocked, so lean on PD + generated exercises). New learning
  **collections/paths**: jazz-harmony, blues-roadmap depth, rhythm-&-groove, ear-training track,
  advanced-harmony, fingerstyle depth.
- **Embed density:** convert prose-only lessons into live, preconfigured tools (the `embed-tool` skill
  covers this). Target: every theory/technique article has ≥1 embed.
- **Difficulty spread:** repertoire skews to levels 2–4 (only 3 items ≥8). Add advanced/expert
  material — pairs naturally with the **level-tier** work (X1).
- **Play-along depth:** more licks (jazz/country/funk categories already noted in backlog), grooves,
  fingerpicking/strumming patterns per genre; song player + backing-track presets per collection.
- ✅ **DONE (2026-07-15)** **Instruments:** `SOUNDFONT_INSTRUMENTS` widened 10 → 36 GM voices across families. Still open: add a
  drum-kit sampled instrument.

---

## 6. New tool proposals

| Tool | What | Effort | Notes |
|---|---|---|---|
| ✅ **DONE (2026-07-15) Fretboard note game** (`/tools/fret-game`) | 60-second timed find-the-note sprint with score/streak + saved best; level-tiered (beginner naturals+labels → advanced all-12 hidden) | M | Shipped |
| ✅ **DONE (2026-07-16) Note-reading game** (`/tools/staff-game`) | The reading counterpart — timed name-the-note-on-the-staff sprint; level-tiered (beginner treble → intermediate+ adds bass clef) | M | Shipped |
| ✅ **DONE (2026-07-15) Chord-progression generator** (`/tools/progression-generator`) | Genre/style templates (pop/folk/blues/jazz/classical) → progression in any key, level-tiered, playable (`progressions.ts`) | M | Shipped |
| ✅ **DONE (2026-07-15) Improvisation / scale-over-chord guide** (`/tools/improvise`) | Pick a chord → every scale that contains its tones (`scalesForChord`), level-tiered, chord+scale playable together | M–L | Shipped |
| **Song/lead-sheet builder** | Compose a lead sheet (chords + melody) from tools, save/share (reuse saved-progressions backend) | L | Extends analyzer's save feature |
| **Rhythm reading game** | Tap/clap along to generated rhythms with timing scoring (mic or key input) | M | Extends rhythm + dictation |
| **Practice planner / routine builder** | Assemble tools + scores into a timed practice session; ties into progress dashboard & streaks | M | Backend already tracks practice minutes |
| ✅ **DONE (2026-07-16) Piano & guitar map** (`/tools/scale-map`) | A scale or chord lit on a 2-octave keyboard AND the neck at once (root filled, tones tinted, clickable); Scale/Chord toggle + level tiers — serves the piano↔guitar-sync goal | S–M | Shipped |

---

## 7. Cross-cutting

- **X1 — Level tiers (Beginner/Intermediate/Advanced/Expert) in every tool.** A shared
  level-context + a small `level` prop that gates option visibility and defaults. Author each tool
  article with clearly labelled level sections. _This is the user's explicit request and should frame
  the whole effort._
- **X2 — Single source of truth for theory data** (resolves the `embeds.ts`/`music-theory.ts` split).
- **X3 — Consistent embeddability** — only 11 of ~50 tools accept preconfigured props; widen so more
  tools can be dropped into lessons.

---

## 8. Prioritized roadmap

**Cross-cutting**
- ✅ **DONE (2026-07-15)** X1 — level-tier selector. `useLevel` hook (`localStorage`-persisted, carries
  across tools) + shared `LevelToggle` (design-system `SegmentedToggle`). Wired into ChordBuilder,
  ScaleExplorer, VoicingLibrary and the chord-diagrams picker: each filters its scale/chord menu via
  `scalesByLevel`/`chordsByLevel` and resets an out-of-range selection. Beginner sees a focused set
  (2 chords / 6 scales), Expert unlocks everything (26 / 20). More tools can adopt `<LevelToggle>` the
  same way. Also **tuner mic pitch-detection was already shipped** (`pitch-detection.ts` + `TuningReference`).

**Phase 1 — Foundation (unblocks everything, do first)**
1. ✅ **DONE (2026-07-15)** X2 + 4.1 — unified + expanded `SCALES` (9→20) and `CHORDS` (10→26). `music-theory.ts` is now the single source of truth: each chord carries `symbol`/`aliases`, from which `embeds.ts` derives its parser. Every scale/chord tagged with a `Level` (beginner→expert) + `scalesByLevel`/`chordsByLevel`/`isWithinLevel` helpers (seeds X1). Added compound interval labels (9/11/13), `diatonicChordsMinor`, and minor-key Roman suffixes. SRS chord-quality deck gated to ≤intermediate so it doesn't regress. Tests + typecheck green; verified live (chords tool 26 types, scale tool 20 scales).
2. C1 — merge keyboard/soundfont. _Trivial win._
3. X1 — introduce the level-tier mechanism (start with 2–3 tools as the pattern).

**Phase 2 — Deepen (high leverage)**
4. ✅ **DONE (2026-07-15)** 4.2 — generative movable chord-shape library at
   `packages/ui/src/components/organisms/music/chord-library.ts` (`generateChordShapes`). Slides E-shape/
   A-shape barre templates (guitar), barre shapes (ukulele) and root grips (bass — previously zero) to
   any root, for 14 qualities incl. maj7/min7/m7♭5/6/add9/9/dim/aug. `ChordShape` gained `baseFret`;
   `ChordDiagram` now windows the neck with a "{n}fr" label for movable shapes. `embeds.ts findChordShape`
   falls back to the generator, so any `CHORDS` symbol (`F♯m7`, `Bbmaj7`, …) now renders instead of
   degrading to text — enriching chord-diagrams/chord-board/strum/progression/song/practice-room embeds.
   21 UI tests (all roots × qualities × instruments: no wrong notes, root-in-bass, essentials) + embeds
   fallback tests; typecheck green; verified live in-app.
5. 4.4 — tuner mic pitch-detection; staff/sight-reading clef+accidental+key coverage.
6. 4.3 — alternate tunings across fretted tools.

4b. ✅ **DONE (2026-07-15)** wired the generator into two tools: the **CAGED explorer** is no longer
   major-only — it's a root + chord-type picker (major/minor/dom7/maj7/min7) rendering CAGED shapes
   (added C/G/D shape families to the library); the **chord-diagrams tool** is now a full chord
   dictionary (instrument × root × quality → every movable voicing, strummable), replacing the 16-shape
   static browser. Both use the shared `ChordDiagram` with `baseFret` neck-windowing.

**Phase 3 — Consolidate** ✅ **RESOLVED (2026-07-15)**
7. C1 + C5 merged (genuine redundancy, with redirects). C2/C3/C4/C6 reviewed and deliberately kept as
   focused single-purpose tools — shared code already factored; a mega-tool would degrade UX. See §3.

**Phase 4 — Content & new tools** — 🔵 **OPEN (additive, ongoing).** Not one-shot tasks; pick items as
priorities dictate. The engine work above (expanded chords/scales, movable shapes, minor-key harmony,
level tiers) is the groundwork these build on.
8. Genre/difficulty content + embed density (Section 5).
9. New tools (Section 6), highest-value first.

---

## Recommended first implementation

**Phase 1, item 1 (X2 + 4.1): unify and expand the theory tables.** It is pure data + unit tests
(the safest possible change), fixes a real duplication bug, and immediately enriches ~15 tools with
more scales and chord qualities — the highest leverage-to-risk ratio in the whole plan. Every level
selector (X1) and downstream deepening depends on it.

---

## Appendix — per-tool detail

_See the two scan reports that produced this audit for exhaustive per-tool file paths, parameters, and
limitations. Key limitation callouts:_

- Scales capped at 9; chord qualities capped at 10 (engine) — parser already has ~20.
- Guitar chord shapes: 16 static open-position; ukulele 11; **zero bass shapes**; no movable-barre generation; unknown symbols degrade to a text label.
- CAGED = major chords only. Tuner = reference tones only (no mic). Staff reader = treble, naturals C4–C6. Sight-reading = C major only. Fretboard route = guitar/standard tuning only.
- Sequencer fixed at 3 tracks × 16 steps. Only 4 SRS decks. Curated/hardcoded content in licks, grooves, notation player, CAGED.
