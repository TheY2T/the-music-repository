# ADR 0025 — Shared multi-size keyboard + sampled-first note service

- **Status:** accepted
- **Date:** 2026-07-14

## Context

Three divergent keyboards existed (`PianoKeyboard`, `SoundfontPlayer`, `VoicingLibrary`), each with a
hardcoded key range, no size selector, no QWERTY input, no sustain, and ignored velocity. Audio was
split: ~43 components used the thin `audio.ts` oscillator (`playTone`); only `SoundfontPlayer` used the
richer sampled `smplr` engine (`soundfont.ts`) — and that was a single-instrument global singleton that
bypassed the master-bus analyser. Goal: one shared, multi-size keyboard with the best audio, and make
that audio reusable across the play-a-note tools.

## Decisions

1. **Shared key geometry** — `apps/web/src/lib/keyboard.ts` (pure, unit-tested) owns `KEYBOARD_SIZES`
   (standard controller sizes 25/37/49/61/76/88, default **61**), `keyLayout(startMidi, count)` (the
   white/black derivation previously copied into three components), and `qwertyMap(baseMidi)` (physical
   `KeyboardEvent.code` → MIDI, layout-agnostic).

2. **`soundfont.ts` → shared note service** — a **per-instrument registry** (not a singleton) so tools
   pick instruments independently; `noteOn`/`noteOff` (sustain, capturing smplr's per-note stopper),
   velocity plumbed (0–1 or 1–127), and `playNote` kept **back-compatible** (one-shot) so the many
   existing callers are untouched. Sampled audio routes through `audio.ts`'s master bus (new
   `getDestination()`) so visualizers tap it. Falls back to the oscillator (`audio.ts` gains held-voice
   `oscNoteOn`/`oscNoteOff`) when no soundfont is loaded — offline/SSR/first-load keep sounding.

3. **One shared component** — `PianoKeyboard.tsx` (rewrite) powers `/tools/keyboard` (`scaleHighlight`)
   and `/tools/soundfont` (`instruments`), retiring `SoundfontPlayer`. Size selector, octave-shift +
   horizontal scroll for big layouts, sustain across pointer/QWERTY/MIDI, velocity from MIDI, and a
   "release all" on blur/unmount so notes never hang. The Pixi scene (`piano-scene.tsx`) gained
   `onRelease`. `VoicingLibrary` reuses `keyLayout` for its read-only diagram.

4. **Broad audio standardization** — the play-a-note theory tools (chord identifier, ear trainer, scale
   explorer/boxes, chord builder, mode explorer, solfège, melodic dictation) swapped
   `playTone(midiToFrequency(m))` → `playNote(m)`, gaining sampled piano with the automatic fallback.
   Timing-critical scheduled/arranged tools (metronome, practice room, backing tracks, sequencers, score
   playback) deliberately **stay** on `audio.ts` `scheduleTone`/`scheduleDrum`.

## Consequences

- `verovio`-style caveat applies: islands on sampled audio are E2E-tested, not unit-tested (dup-React /
  `optimizeDeps`); the pure `keyboard.ts` logic is unit-tested instead.
- New UI strings match the existing keyboard tools' hardcoded-English convention; localizing these tools
  is a separate follow-up (called out, not silently expanded).
- Sampled audio now feeds the visualizer analyser, a bonus from master-bus routing.
