# Feature: Play-along (Phase 5)

- **Phase:** 5 · **Status:** shipped (Slice A + B)
- **Flag keys:** `tools.backing-track` (`ToolBackingTrack`), `tools.voicings` (`ToolVoicings`) — from
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

## Tests

- **Web (browser) — backing track:** the 12-bar-blues grid renders the textbook form in C —
  `C7 C7 C7 C7 | F7 F7 C7 C7 | G7 F7 C7 G7`. Pressing **Play along** advances the highlighted bar
  cursor monotonically through the loop (verified 1→2→3 over ~3 s at 100 BPM) and the button toggles to
  **Stop**. Transposition + progression swap verified live: key **G** + **ii–V–I** →
  `Am7 – D7 – Gmaj7 – Gmaj7`.
- **Web (browser) — voicings:** C major 7 → Close `C E G B`; 1st/2nd/3rd inversions put the 3rd/5th/7th
  in the bass (`E G B C`, `G B C E`, `B C E G`); Drop 2 `G C E B`, Drop 3 `E C G B`, Shell `C E B`. C
  major triad → Close `C E G`, inversions, Open (spread) `C G E`. Lit keys match the named tones.
- Build/lint/check-types green across the workspace (25/25).

## Next slices (Phase 5 menu)

- Notation-synced player (cursor highlight) via a notation renderer + soundfont audio.
- Pitch-preserving tempo, loop/section, transpose on hosted audio.
- Lick / turnaround library with diagrams + tab.
