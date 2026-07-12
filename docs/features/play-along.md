# Feature: Play-along (Phase 5)

- **Phase:** 5 · **Status:** shipped (Slices A–Z)
- **Flag keys:** `tools.backing-track` (`ToolBackingTrack`), `tools.voicings` (`ToolVoicings`),
  `tools.notation-player` (`ToolNotationPlayer`), `tools.licks` (`ToolLicks`), `tools.chord-diagrams`
  (`ToolChordDiagrams`), `tools.strumming` (`ToolStrumming`), `tools.fingerpicking`
  (`ToolFingerpicking`), `tools.arpeggio` (`ToolArpeggio`), `tools.progression-player`
  (`ToolProgressionPlayer`), `tools.rhythm` (`ToolRhythm`), `tools.caged` (`ToolCaged`),
  `tools.scale-boxes` (`ToolScaleBoxes`), `tools.song` (`ToolSong`), `tools.progression-ear`
  (`ToolProgressionEar`), `tools.chord-quality-ear` (`ToolChordQualityEar`), `tools.fret-quiz`
  (`ToolFretQuiz`), `tools.musicxml` (`ToolMusicXml`), `tools.multi-voice` (`ToolMultiVoice`),
  `tools.practice-player` (`ToolPracticePlayer`) — from `@TheY2T/tmr-flags`. Default on.

## Purpose

The first Phase-5 **play-along** capability: a looping **backing-track generator** you jam over on any
instrument. It arranges a full rhythm section (drums + walking bass + comping chords) from a chosen
**chord progression × key × tempo** — the plan's "backing-track / 12-bar-blues generator" — reusing the
Phase-3 dependency-free Web Audio engine and music-theory helpers (no notation library, no backend).

## UX behaviour

- `/tools/backing-track` — pick a **key** (12 roots), a **progression**, and a **tempo** (60–180 BPM),
  then **Play along** to loop the arrangement. All three controls update **live** while it plays
  (change key to transpose, swap progression, or nudge tempo without stopping).
- **Progressions:** 12-bar blues (I7·IV7·V7 dominant-seventh form), I–V–vi–IV (pop), I–vi–IV–V (50s),
  ii–V–I (jazz, with m7 / maj7 voicings).
- **Bars grid** shows each bar's chord name (transposed into the chosen key) + its Roman numeral, with
  the **current bar highlighted** as the loop plays.
- **Per-part mix:** drums / bass / chords checkboxes mute or solo a role (e.g. mute chords to practise
  comping, or mute bass to practise a bass line).
- Renders the **Info View** (Phase 2); "Progression" carries `data-help="chords"` and "Tempo"
  `data-help="rhythm"`, feeding the shared contextual glossary.

## Architecture

Client-side only — no API, no DB. Extends the existing tool foundation:

- `apps/web/src/lib/audio.ts` — added **`scheduleTone(frequency, atTime, duration, {type, gain})`**, a
  precisely-scheduled oscillator note (peer of `scheduleClick` / `scheduleDrum`) so the arrangement can
  place bass and chord tones at exact future AudioContext times.
- `apps/web/src/components/BackingTrack.tsx` — the island. Progressions are data (`{rootOffset,
  intervals, roman, suffix}` per bar, relative to the key root). A **lookahead scheduler** (same 25 ms
  interval / look-ahead pattern as the metronome and sequencer) walks bar → beat and schedules each
  beat's events: hi-hat eighths + kick (1·3) + snare (2·4); bass root (beat 1) / fifth (beat 3) in the
  low register; off-beat comping chord stabs (beats 2·4) in the mid register. Key, progression, tempo,
  and part-mix are held in refs so live changes take effect on the next scheduled beat.
- `apps/web/src/pages/tools/backing-track.astro` — flag-gated page (redirects to `/tools` when off);
  added to the `/tools` hub and the home-page tools link.

## Slice B — Voicing library (`tools.voicings`)

`/tools/voicings` — pick a **root + chord quality** (the existing `CHORDS`) → a grid of standard
**voicings** of that chord, each rendered on a fixed 3-octave keyboard diagram (C3–B5, so shapes stay
comparable), with the chord tones lit + named, and **Play** (block) / **Arpeggiate** buttons. Any lit
key is itself clickable to hear that single note.

- **Triads** → Close (root position), 1st & 2nd inversion, Open (spread — middle voice up an octave).
- **Seventh chords** → the above + 3rd inversion, **Drop 2**, **Drop 3**, and **Shell (1–3–7)**.
- Voicing generation is pure array math local to `VoicingLibrary.tsx` (`invert` rotates the lowest
  voices up an octave; `drop` lowers the *n*-th-from-top voice an octave) — no backend, no new deps.
  Reuses `midiToFrequency` + `playTone`. Pairs with the backing track: learn the chords you jam over.

## Slice C — Notation-synced player (`tools.notation-player`)

`/tools/player` — a lightweight **notation-synced player** with no heavy notation dependency: it renders
a single-line melody on the treble staff (reusing `StaffSequence`) and, on **Play**, moves a **cursor**
(highlight box + coloured note head) from note to note **in sync with the audio**.

- Controls: **Piece** (public-domain melodies: Ode to Joy, Twinkle, Mary Had a Little Lamb, C major
  scale — natural notes only), **Tempo** (40–200 BPM, live), **Loop** toggle, and a **section** (from /
  to note) so you can drill just a passage. All adjustable while playing.
- Implementation: `StaffSequence` gained an optional `activeIndex` prop (draws the cursor box + blue note
  head; fully backward-compatible). `NotationPlayer.tsx` drives a recursive `setTimeout` step that reads
  tempo/loop/section from refs so live changes take effect on the next note; wraps to the section start
  when looping, stops at the section end otherwise. Reuses `midiToFrequency` + `playTone` — client-side,
  no backend, no notation library. (A full MusicXML/multi-voice renderer remains a later enhancement.)

## Slice D — Lick & turnaround library (`tools.licks`)

`/tools/licks` — a curated library of guitar **licks and turnarounds** rendered as **interactive tab**
(string names down the left, fret numbers in sequence; stacked numbers = a double-stop played together).
Press **Play** to hear a lick with the active tab column highlighting in time; a **tempo** slider works
it up to speed, and a **category** filter (Blues / Rock / Turnarounds) narrows the list.

- Licks are curated data local to `LickLibrary.tsx` (`Step[]` of `{string, fret}`). Fret → pitch uses
  the existing `STANDARD_TUNING`; playback reuses `playTone` on a ref-driven `setTimeout` step (one
  active playback at a time). Includes: A minor pentatonic run, B.B. King-style lick, a Chuck-Berry
  double-stop boogie, and an E blues turnaround (chromatic descent). No backend, no new deps.

## Slice E — Transpose in the notation player

The notation player (`/tools/player`) gained a **Key (transpose)** control (12 keys). The melody is
recomputed from each note's MIDI + transpose and re-spelled via a new pure helper
`staffPlacement(midi, flats)` in `music-theory.ts` (returns staff `step`, `label`, and `accidental`).
`StaffSequence` now renders a **♯/♭ glyph** left of the note head (`StaffNoteDatum.accidental`, optional
and backward-compatible). Transposing up spells with sharps, down with flats; the range stays within ±6
semitones for readability. Changing key restarts playback in the new key.

## Slice F — Bends & slides in the lick library

The lick library (`/tools/licks`) gained articulations: a `TabNote` may carry `bend` (semitones) or
`slideTo` (target fret). The tab renders **`7b`** (bend) and **`5/7`** (slide) notation, and playback
uses a new **`playGlide(fromFreq, toFreq, duration)`** audio primitive (oscillator frequency ramp) so a
bend/slide is actually heard gliding into pitch. Two new licks showcase them (Blues bend lick, Sliding
rock lick).

## Slice G — Rhythm in the notation player

The pieces now carry per-note **durations** (`beats`, quarter = 1). `StaffSequence` gained an optional
`beats` field and draws the **note-value glyph** — filled vs **open** head (half+), **stem** (direction
by staff position), **flag** (eighths), and **augmentation dot** (dotted values) — all gated on `beats`
so existing consumers (sight-reading, staff reader) render exactly as before. Playback holds each note
for `beats × secondsPerBeat`, so Ode to Joy's closing dotted-quarter / eighth / half rhythm is both seen
and heard.

## Slice H — Hammer-ons & pull-offs in the lick library

`TabNote` gained `legatoTo` (target fret on the same string). The tab renders **`5h7`** (hammer-on) /
**`7p5`** (pull-off) — the `h`/`p` is derived from the pitch direction — and playback sounds the first
note then the second legato and softer (a delayed, quieter `playTone`). A new **Legato pentatonic lick**
showcases it.

## Slice I — Rests in the notation player

A piece note can be a rest (name `'R'`). `StaffNoteDatum` gained a `rest` flag and `StaffSequence` draws
the rest as **hand-drawn SVG** (a zigzag quarter rest, a bar half rest, a blob-and-stroke eighth rest,
plus an augmentation dot) — unicode rest glyphs were dropped because the system font renders them as a
striped block. Playback dwells for the rest's `beats` but plays nothing. A **Rhythm study (with rests)**
piece demonstrates it.

## Slice J — Guitar chord diagrams

A new tool `/tools/chord-diagrams` (`tools.chord-diagrams`): a curated library of common **open and barre
guitar chords** (C A G E D · Am Em Dm · F Bm), each rendered as a **chord diagram** (SVG fret grid, low E
on the left, dots for fretted notes, × muted / ○ open above the nut), filterable by quality. Click a
chord to **strum** it (staggered `playTone` up the strings, low→high). `ChordDiagrams.tsx`, curated data,
no backend.

## Slice K — Speed trainer in the lick library

The lick library gained a **Speed trainer** toggle. With it on, playing a lick loops it and adds
`SPEED_STEP` (15) BPM each pass up to `SPEED_PASSES` (4) faster — the tempo slider tracks the ramp — so
you drill a lick from slow to fast automatically. Implemented in the existing `playLick` loop via refs.

## Slice L — Strumming pattern trainer

A new tool `/tools/strumming` (`tools.strumming`): pick a **chord** + a **strum pattern** (all-downs,
down-up eighths, D–DU–UDU pop, folk) + tempo, and loop one bar of eighth-note strums to play along.
Each slot shows ↓ / ↑ / · with the current beat highlighted; the selected chord's diagram is shown.
`ChordDiagrams.tsx` was refactored to export `GUITAR_CHORDS`, `ChordShape`, `ChordDiagram`, and a
`strumChord(frets, direction)` helper, reused by `StrummingTrainer.tsx` (down = low→high, up = high→low).

## Slice M — Metronome click in the notation player

The notation player gained a **Click** toggle: an independent beat timer runs alongside playback and
sounds `scheduleClick` on each beat (accented every 4), so you can play along in time.

## Slice N — Fingerpicking pattern trainer

A new tool `/tools/fingerpicking` (`tools.fingerpicking`): pick a **chord** + a **picking pattern**
(Travis alternating bass, bass + ascend, ballad) + tempo, and loop one bar of eighth-note plucks. Slots
resolve per chord — `B`/`A` = bass / alternate bass (the two lowest non-muted strings), `3`–`5` = treble
strings — and each slot displays the plucked string letter (E A D G B e) with the current one highlighted.
Reuses `GUITAR_CHORDS` / `ChordDiagram` / `TUNING_LOW_FIRST`.

## Slice O — Arpeggio player

A new tool `/tools/arpeggio` (`tools.arpeggio`): pick a **root + chord quality** (music-theory `CHORDS`)
+ a **direction** (up, down, up-&-down, down-&-up) + tempo, and loop the arpeggio one note at a time with
the current note highlighted. `arpeggioMidis` builds the ordered MIDI sequence (chord tones + the octave);
up-&-down / down-&-up omit the repeated endpoints.

## Slice P — Chord progression play-along

A new tool `/tools/progression-player` (`tools.progression-player`): pick a **progression** (C–G–Am–F,
C–Am–F–G, G–D–Em–C, Am–F–C–G), a **strum** pattern, and tempo, and loop the progression **one bar per
chord** — the chords' diagrams show in a row with the current chord highlighted, plus the strum-slot
cursor. Reuses `GUITAR_CHORDS` / `ChordDiagram` / `strumChord`. It's the song-level counterpart to the
single-chord strumming trainer.

## Slice Q — Rhythm trainer

A new tool `/tools/rhythm` (`tools.rhythm`): pick a one-bar **rhythm** (quarters, eighths, syncopated,
gallop, dotted) and Play to hear it — a woodblock per note over a steady metronome **Click** — with the
note cursor moving through the bar. Reuses `StaffSequence`'s note-value glyphs (all notes on the middle
line) so the rhythm is read on a staff; playback holds each note for its `beats`.

## Slice R — CAGED explorer

A new tool `/tools/caged` (`tools.caged`): shows a chosen major chord in all **five CAGED shapes**
(C–A–G–E–D) up the neck as fret diagrams (self-contained windowed `ShapeDiagram` with a starting-fret
label), click to strum. The five shapes are stored for C major and **transposed by a uniform semitone
shift** (folded down an octave if past the 12th fret), which is valid because CAGED shapes are movable.

## Slice S — Scale-in-position boxes

A new tool `/tools/scale-boxes` (`tools.scale-boxes`): pick a **root + scale** and a **position** (a
sliding 5-fret window), and the fretboard highlights just the scale notes in that box (roots emphasised),
or the **whole neck**. Click any note to hear it. Reuses `SCALES` / `scalePitchClasses` / `STANDARD_TUNING`.

## Slice T — Song player (melody + chords)

A new tool `/tools/song` (`tools.song`): plays a **melody on the staff** with a **strummed chord under
each bar** — the current chord is highlighted and the note cursor moves. Chords can be toggled off to
practise the melody alone. `buildNotes` tags each melody note with its bar + downbeat flag; the player
strums `chords[bar]` (via `strumChord`) on each bar's downbeat. Two songs (Ode to Joy, Twinkle).

## Slice U — Progression ear-training

A new tool `/tools/progression-ear` (`tools.progression-ear`): plays a random diatonic **progression** in
C (block triads from `diatonicChords`), and you pick which of four it was (I–V–vi–IV, I–vi–IV–V, ii–V–I,
I–IV–V) with instant feedback + a running score. Replay + Next.

## Slice V — Chord-quality ear training

A new tool `/tools/chord-quality-ear` (`tools.chord-quality-ear`): plays a chord on a random root (block
then a quick arpeggio) and you name its **quality** from seven options (Major, Minor, Diminished,
Augmented, Dominant/Major/Minor 7th) — instant feedback + running score. Reuses `CHORDS`.

## Slice W — Fretboard note quiz

A new tool `/tools/fret-quiz` (`tools.fret-quiz`): highlights a random position on the guitar neck
(strings × frets 0–12) and you pick the note name from the twelve pitch classes; the fret plays and
reveals its name on answer. Reuses `STANDARD_TUNING` / `pitchName`.

## Slice X — MusicXML import (dependency-free)

A new tool `/tools/musicxml` (`tools.musicxml`): parses a **MusicXML** score with the browser's built-in
`DOMParser` (no library) — reading `<divisions>`, `<note>`, `<pitch>` (step/octave/alter), `<duration>`,
and `<rest/>` — maps it to `StaffNoteDatum`s (via `staffPlacement`, spelling by the `alter` sign) and
renders it on `StaffSequence` with playback. Upload a `.musicxml`/`.xml` file, paste source, or load the
built-in sample. Single-voice (secondary `<chord/>` notes skipped).

## Slice Y — Multi-voice (chord) engraving (dependency-free)

A new tool `/tools/multi-voice` (`tools.multi-voice`): a self-contained staff renderer that **stacks
multiple noteheads per beat** — engraving the seven diatonic triads of a key as chords, with shared
ledger lines and per-note accidentals, roman numerals, per-chord playback, and a play-through cursor.
`toAscending` stacks each triad's pitch classes into ascending MIDI; reuses `diatonicChords` /
`staffPlacement` / `ledgerSteps`.

## Slice Z — Time-stretch practice player (dependency-free)

A new tool `/tools/practice-player` (`tools.practice-player`): load a local audio file (via
`URL.createObjectURL`) and practise with **pitch-preserving tempo** — `HTMLAudioElement.playbackRate`
plus `preservesPitch` (standard + `moz`/`webkit` prefixes) — and an **A–B loop** (capture Set A / Set B,
loop via the `timeupdate` handler). Everything runs locally; the file never leaves the browser.

## Tests

- **Web (browser) — backing track:** the 12-bar-blues grid renders the textbook form in C —
  `C7 C7 C7 C7 | F7 F7 C7 C7 | G7 F7 C7 G7`. Pressing **Play along** advances the highlighted bar
  cursor monotonically through the loop (verified 1→2→3 over ~3 s at 100 BPM) and the button toggles to
  **Stop**. Transposition + progression swap verified live: key **G** + **ii–V–I** →
  `Am7 – D7 – Gmaj7 – Gmaj7`.
- **Web (browser) — voicings:** C major 7 → Close `C E G B`; 1st/2nd/3rd inversions put the 3rd/5th/7th
  in the bass (`E G B C`, `G B C E`, `B C E G`); Drop 2 `G C E B`, Drop 3 `E C G B`, Shell `C E B`. C
  major triad → Close `C E G`, inversions, Open (spread) `C G E`. Lit keys match the named tones.
- **Web (browser) — notation player:** Ode to Joy renders on the staff as
  `E E F G G F E D C C D E E D D`; pressing Play advances the cursor/highlight note-by-note in sync with
  the audio (0→1→2→3…). Setting the section to notes 5–8 confines playback to indices 4–7 and loops
  there ("Notes 5–8 of 15").
- **Web (browser) — licks:** all four licks pitch-verify against standard tuning — A pentatonic run
  `G E D C A G E D C A`, B.B. lick `C A G E D C`, boogie double-stops `D+A / C+G`, and the E turnaround
  with both voices descending chromatically (`G F♯ F E` over `B A♯ A G♯`) resolving to E. Play advances
  the highlighted tab column in sync (0→1→2→3→4).
- **Web (browser) — transpose (Slice E):** Ode to Joy in D renders `F♯ F♯ G A A G F♯ E D D E F♯ F♯ E E`
  with ♯ glyphs before each F♯; key B (transpose −1) re-spells with flats (`E♭4` + ♭ glyph).
- **Web (browser) — articulations (Slice F):** the tab shows `7b` (Blues bend lick) and `5/7` (Sliding
  rock lick); Play glides the pitch and advances the column cursor without error.
- **Web (browser) — rhythm (Slice G):** Ode to Joy renders 15 heads with 1 open half-note head, 1 flag
  (eighth), and 1 augmentation dot (dotted quarter); sight-reading (no `beats`) still renders 8 plain
  filled heads with no stems/flags/dots. Playback dwell is proportional — at 180 BPM the dotted quarter
  holds ~1.5× the quarter.
- **Web (browser) — legato (Slice H):** the Legato pentatonic lick tab shows `5h7`, `5h7`, `5`, `8p5`;
  Play sounds both notes of each pair and advances the column cursor.
- **Web (browser) — rests (Slice I):** the Rhythm study renders 4 note heads with three drawn quarter
  rests between them (verified visually — proper squiggles, not font tofu); playback advances the cursor
  through the rest positions (indices 1·3·5) silently.
- **Web (browser) — chord diagrams (Slice J):** all 10 shapes render correctly (verified visually — dots,
  × muted, ○ open); clicking C strums without error.
- **Web (browser) — speed trainer (Slice K):** with the trainer on, playing a lick ramps the tempo
  110 → 125 BPM per pass (verified live).
- **Web (browser) — strumming (Slice L):** the pop pattern renders `↓ · ↓ ↑ · ↑ ↓ ↑`, the chord diagram
  shows, and Play advances the highlighted slot in time.
- **Web (browser) — click (Slice M):** the notation player's Click toggle enables and playback runs with
  it on (independent beat timer, no errors).
- **Web (browser) — fingerpicking (Slice N):** the Travis pattern on C resolves to `A e D B A e D B`
  (bass/alt-bass + treble strings) and the highlight advances.
- **Web (browser) — arpeggio (Slice O):** C major Up = `C E G C`; Up-&-down = `C E G C G E` (no repeated
  endpoints); the note cursor advances.
- **Web (browser) — progression (Slice P):** the default shows C G Am F diagrams; Play advances the
  current-chord highlight bar by bar.
- **Web (browser) — rhythm (Slice Q):** the syncopated bar renders 5 heads with 2 eighth-note flags; Play
  moves the note cursor through the bar over the click.
- **Web (browser) — CAGED (Slice R):** C major renders the five shapes at their canonical positions
  (starting frets 3/5/8/10 for A/G/E/D; C shape open) — verified visually.
- **Web (browser) — scale boxes (Slice S):** A minor pentatonic at position 5 lights exactly A C D E G.
- **Web (browser) — song (Slice T):** Ode to Joy shows chord bar C C G C + 15 melody notes; Play moves
  the cursor and advances the current-chord highlight (chords strum under each bar).
- **Web (browser) — progression ear (Slice U):** the four options render; a correct guess scores 1/1 with
  "✓ Correct!" and Next resets.
- **Web (browser) — chord ear (Slice V):** seven quality options render; a correct guess scores 1/1 with
  "✓ Correct!".
- **Web (browser) — fret quiz (Slice W):** a random target (D string fret 10 = C) is named correctly →
  1/1, and the cell reveals "C" — the tool's answer matches independent tuning computation.
- **Web (browser) — MusicXML (Slice X):** the sample parses to `C4 D4 E4 F♯4 G4 [rest] B♭4 C5` — 7
  noteheads + 1 quarter-rest, with the ♯/♭ from `<alter>` — proving DOMParser pitch/accidental/rest handling.
- **Web (browser) — multi-voice (Slice Y):** C major engraves 7 triads (I ii iii IV V vi vii° = C Dm Em
  F G Am B°) as **21 stacked noteheads**; Play-all highlights advance.
- **Web (browser) — practice player (Slice Z):** an uploaded WAV drives the `<audio>`; the speed slider
  sets `playbackRate` (0.6×) and the toggle flips `preservesPitch` true→false; A–B loop buttons present.
- Build/lint/check-types green across the workspace (25/25).

## Backlog extensions (from `docs/backlog.md`)

Two of the Group-2 backlog tools shipped (dependency-free, reusing `music-theory.ts`):

- **Chord analyzer** `/tools/analyzer` (`tools.analyzer`) — build a progression in a key; each chord
  shows its **Roman numeral** + **function** (Tonic / Predominant / Dominant, colour-coded), with
  non-diatonic chords flagged **borrowed**. New pure helper `analyzeChordInKey(keyRoot, chordRoot,
  chordKey)`. *Verified:* C: I–V–vi–IV → I(T)/V(D)/vi(T)/IV(P); B♭ in C → ♭VII "borrowed".
- **Web MIDI input** — a shared `useMidiInput` hook (built-in Web MIDI API, no dependency) wired into
  **two** tools: the interactive keyboard (`/tools/keyboard` — notes light up green + sound) and the
  **chord identifier** (`/tools/chord-identifier` — held notes union with manual toggles → live chord
  detection). Both show a device status line and degrade gracefully. *Verified* with a mocked MIDI
  device: keyboard note-on → C4 highlighted + "Last note: C4"; chord identifier holding C-E-G → "C Major".
- **Ear-trainer, MIDI answering** (`/tools/ear-trainer`) — with a MIDI keyboard, answer an interval by
  **playing the two notes** (`useMidiInput` collects a 2-note buffer → interval → submitted as the guess).
  *Verified:* playing C4+G4 auto-submits and scores.
- **Metronome upgrades** (`/tools/metronome`) — **subdivisions** (quarter/eighth/triplet/sixteenth — soft
  high tick between beats) and a **polyrhythm** layer (N evenly-spaced ticks per bar, distinct pitch),
  both scheduled in the lookahead scheduler. *Verified:* controls present, triplets + 3:4 poll run.
- **Melodic dictation** `/tools/melodic-dictation` (`tools.melodic-dictation`) — hear a C-major melody,
  rebuild it from a note palette, Check (per-note grading) / Reveal (staff). *Verified:* entering the
  target scores "Perfect".
- **Rhythm dictation** `/tools/rhythm-dictation` (`tools.rhythm-dictation`) — hear a one-bar rhythm,
  rebuild it from note values (♪ ♩ ♩. 𝅗𝅥), Check / Reveal. *Verified:* entering the target scores "Correct".
- **Groove library** `/tools/grooves` (`tools.grooves`) — rock / pop / funk / half-time drum grooves
  (kick/snare/hi-hat over eighths) looped with a step cursor. *Verified:* rock = hi-hat×8, snare 2·4, kick 1·3.
- **Sight-singing / solfège** `/tools/solfege` (`tools.solfege`) — a C-major melody on the staff labelled
  with movable-do solfège / scale degrees / note names. *Verified:* fa sol mi… ↔ 4 5 3….
- **Key-signature quiz** `/tools/key-quiz` (`tools.key-quiz`) — name the major key from its signature
  (count + ordered accidental names). *Verified:* 2 flats → B♭ major, graded correct.
- **Bass-line generator** `/tools/bassline` (`tools.bassline`) — generates a bass line under a progression
  in three styles: **roots**, **root–fifth**, or a **walking** line (root · 3rd · 5th · chromatic approach
  to the next chord), shown per beat with a moving cursor. *Verified:* walking over Dm (ii–V–I) → D F A F♯.
- **Transposer & capo** `/tools/transposer` (`tools.transposer`) — transpose a progression by semitones
  (original vs transposed rows, both playable) + **capo suggestions** mapping the new key to open-chord
  shapes (C A G E D) via `capoSuggestions(tonicPc)`. *Verified:* C G Am F +2 → D A Bm G; capo D → no
  capo / Capo 2 (C shapes) / Capo 5 (A) / Capo 7 (G).

## Next slices (Phase 5 menu)

- Notation player: MusicXML/multi-voice rendering, rests & beaming, soundfont audio.
- Pitch-preserving tempo + loop/section on hosted audio recordings.
- More backlog tools: Web MIDI input, melodic/rhythm dictation, groove/bass-line generators.
