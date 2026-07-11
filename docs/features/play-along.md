# Feature: Play-along (Phase 5)

- **Phase:** 5 (Slice A) · **Status:** shipped
- **Flag key:** `tools.backing-track` (from `@TheY2T/tmr-flags`, `ToolBackingTrack`). Default on.

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

## Tests

- **Web (browser):** the 12-bar-blues grid renders the textbook form in C —
  `C7 C7 C7 C7 | F7 F7 C7 C7 | G7 F7 C7 G7`. Pressing **Play along** advances the highlighted bar
  cursor monotonically through the loop (verified 1→2→3 over ~3 s at 100 BPM) and the button toggles to
  **Stop**. Transposition + progression swap verified live: key **G** + **ii–V–I** →
  `Am7 – D7 – Gmaj7 – Gmaj7`. Build/lint/check-types green across the workspace (25/25).

## Next slices (Phase 5 menu)

- Notation-synced player (cursor highlight) via a notation renderer + soundfont audio.
- Pitch-preserving tempo, loop/section, transpose on hosted audio.
- Voicing library (drop-2/3, ii-V-I) + lick/turnaround library with diagrams + tab.
