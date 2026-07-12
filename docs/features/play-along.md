# Feature: Play-along (Phase 5)

- **Phase:** 5 · **Status:** shipped (Slice A + B + C + D)
- **Flag keys:** `tools.backing-track` (`ToolBackingTrack`), `tools.voicings` (`ToolVoicings`),
  `tools.notation-player` (`ToolNotationPlayer`), `tools.licks` (`ToolLicks`) — from
  `@TheY2T/tmr-flags`. Default on.

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
- Build/lint/check-types green across the workspace (25/25).

## Next slices (Phase 5 menu)

- Notation player: MusicXML/multi-voice rendering, rests & beaming, soundfont audio.
- Pitch-preserving tempo + loop/section on hosted audio recordings.
- More licks/voicings; hammer-on/pull-off notation.
