---
paths:
  - "apps/web/src/pages/tools/**"
  - "packages/musickit-ui/**"
  - "packages/music-core/**"
---

# Interactive tools

Client-side only — **no API**. Each tool is a `/tools/<slug>` route gated on its own `tools.*` flag
(redirect to `/tools` when off); new tools drop into the `/tools` hub the same way. See
`docs/features/interactive-tools.md` and the **`embed-tool`** skill (which lists every tool + how to embed
a preconfigured one in a catalogue article).

## Reuse the shared engines — don't hand-roll

- **Theory:** `music-theory.ts` — the single source of truth (`symbol`/`aliases`/`level`, `SCALES`,
  `CHORDS`, 12-TET helpers). Add scales/chords here; embeds + tools derive from it.
- **Audio:** `audio.ts` — dependency-free Web Audio. `playTone`/`playGlide` (one-shots),
  `scheduleTone`/`scheduleDrum`/`scheduleClick` (lookahead scheduler for metronome/sequencer/backing
  tracks), `getAnalyser()` (master-bus FFT for Pixi visualizers), `getDestination()` (master bus).
- **Notes:** `soundfont.ts` — sampled-first note service (per-instrument registry, lazy `import('smplr')`,
  velocity, oscillator fallback so it always sounds offline). Play-a-note tools call `playNote`; always
  `releaseAll` on blur/unmount so nothing hangs.
- **Keyboard:** ONE island `PianoKeyboard` (`lib/keyboard.ts` `KEYBOARD_SIZES` 25–88) backs both
  `/tools/keyboard` and `/tools/soundfont` (ADR 0025).
- **Web MIDI:** `use-midi-input.ts` (`useMidiInput`, no dep). Mock in Playwright via `addInitScript` on
  `navigator.requestMIDIAccess` + dispatch `onmidimessage`.

## Notation

Notation-bearing tools generate **alphaTex** and render via alphaTab (ADR 0027) — see
`.claude/rules/scores.md`. `StaffSequence` is retired from `apps/web` (still in `@TheY2T/tmr-ui` for
Storybook). Fretboard-box / scale-degree tools (ScaleBoxes, ScaleExplorer) are **not** staff notation —
they keep bespoke SVG/DOM.

## Drills (ADR 0014, `docs/features/drill-engine.md`)

Objective drill engine (flag `trainers.drill-engine`): objective answer-checking + per-skill mastery. Engine core +
generators live in `@TheY2T/tmr-music-core/drills/`; `DrillSession` island in `@TheY2T/tmr-musickit-ui`;
attempts recorded via `@TheY2T/tmr-web-acl/drills-api` → `apps/api/src/attempts/`. The server only stores
SM-2 scheduling — add a deck without touching the backend. Author decks via the **`author-content`** skill.

Visual/animated parts use PixiJS — see `.claude/rules/pixi.md`.
