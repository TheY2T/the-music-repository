---
name: embed-tool
description: Reference for every interactive learning tool in The Music Repository and how to embed a preconfigured one inside a catalogue article (the `embeds` block). Use when a text-only lesson should be implemented with a live, preconfigured tool, or when you need to know what tools exist and how to parameterize them.
---

# embed-tool

Catalogue articles can render **preconfigured interactive tools** below their prose via an authored
`embeds` block. This is the mechanism to turn a text-only lesson (a scale, chord set, progression,
piece, theory topic) into something the reader actually plays. See ADR 0028 · `docs/features/content-embeds.md`.

## How embedding works

1. Author a fenced **```embeds** block anywhere in the content Markdown
   (`apps/api/src/infrastructure/database/content/<slug>.md`). It is a JSON array of embeds; the build
   **removes the block from the prose** and stores it in `details.embeds` (JSONB). Embeds render below
   the body, in array order, each in a titled card.
2. `pnpm --filter @TheY2T/tmr-api content:build` regenerates `seed-content.ts`. The seed writes
   `details` (embeds included) to `content_items`; the detail API serves it as `ContentDetail.embeds`;
   the web `ContentEmbeds` component (`apps/web/src/components/content/ContentEmbeds.tsx`) maps each
   embed → a lazy-loaded, preconfigured tool island.
3. The `embeds` field is **spec-first**: the `ContentEmbed` model lives in `packages/api-spec/main.tsp`
   → `pnpm spec:generate`. The domain type is `ContentEmbed` in `catalogue/domain/content-item.ts`.

The build **fails** on malformed JSON or an unknown `tool`, so a typo is caught at build time.

## The embed schema (`ContentEmbed`)

```jsonc
{
  "tool": "score" | "keyboard" | "scale-boxes" | "chord-diagrams" | "progression" | "circle-of-fifths",
  "title": "Optional heading (else a per-tool default)",
  "caption": "Optional one-line explanation shown under the heading",
  // tool-specific fields (only the ones that apply are read):
  "tex": "…alphaTex…",          // score: inline notation/tab to render + play
  "mode": "standard" | "tab",   // score: piano-style notation vs guitar tab
  "tuning": [40,45,50,55,59,64],// score (tab): open-string MIDI for a pitched score
  "instrument": "guitar" | "ukulele" | "bass" | "piano",
  "root": "A",                  // scale-boxes / keyboard: scale root note
  "scale": "minor-pentatonic",  // scale-boxes / keyboard: scale id (see SCALES in music-theory.ts)
  "key": "A",                   // progression: key
  "chords": ["C","G","Am","F"], // chord-diagrams / progression: chord symbols
  "size": 49,                   // keyboard: key count
  "videoUrl": "https://youtu.be/…", // youtube: video URL (id/title/thumbnail cached from oEmbed on save)
  "start": 30                   // youtube: playback start offset in seconds
}
```

## Embeddable tools (preconfigurable)

| `tool` | Renders | Preconfigure with | Use for |
|---|---|---|---|
| `score` | `ScorePlayer` (alphaTab): full transport, play/loop/tempo, click-to-hear, standard **or** tab | `tex` (alphaTex), `mode`, `tuning` | any playable notation: a scale as notation/tab, a lick, an exercise, a worked example, a short piece |
| `scale-boxes` | `ScaleBoxes`: movable fretboard scale-box grid | `root`, `scale` | guitar scale shapes / positions |
| `keyboard` | `PianoKeyboard` with scale highlight | `root`, `scale`, `size` | piano scales, note layout, theory on the keys |
| `chord-diagrams` | tappable chord-shape grid — fretboard diagrams for `guitar`/`ukulele`/`bass`, keyboard diagrams for `piano` | `instrument`, `chords` | chord vocabularies; hear each shape |
| `progression` | `ProgressionPlayer`: loops a progression, strum patterns | `chords` (`key` for labelling) | diatonic/blues progressions, cadences, turnarounds |
| `circle-of-fifths` | `CircleOfFifths` (interactive) | — | key signatures, key relationships |
| `strum` | `StrumPattern` (Pixi): beat cells (↓ down, ↑ up, - rest), highlights the sounding beat | `pattern` (`["D","-","D","U",…]`), `chords`, `instrument`, `tempo` | strum & picking patterns |
| `chord-board` | `ChordBoard` (Pixi): tappable chord cards that sound the chord's tones | `chords` (`["C","Dm","Em",…]`), `labels` (parallel Roman numerals, optional) | chord/degree/quality/cadence/mode tables |
| `rhythm` | `Rhythm` (Pixi): note-value blocks sized by duration, clicked out at tempo | `pattern` (note values `["whole","half","quarter","eighth","sixteenth"]`, dotted-* ok), `tempo` | note-value / beat grids |
| `intervals` | `Intervals` (Pixi): the 12 intervals above a root as tappable cards (hear each) | `root` (default `C`) | interval ↔ semitone tables |
| `fingering` | `Fingering` (Pixi, reuses `fretboard-scene`): scale on the neck, roots highlighted, tap to hear | `instrument` (`guitar`/`bass`/`ukulele`), `root`, `scale`, `tuning` (override) | fretboard fingering charts |
| `youtube` | `YouTubeEmbed` (`@TheY2T/tmr-ui`): lazy `youtube-nocookie` facade — thumbnail + play, iframe on click | `videoUrl` (required), `start` (seconds) | a video demonstrating the piece; title/thumbnail resolve from oEmbed on save (ADR 0042) |

**Pixi tools (ADR 0029):** the ASCII-replacement visualisations render with PixiJS (WebGL). Each is a
fit-for-purpose `lib/pixi/<name>-scene.tsx` (presentational, `useThemeColors`) behind `PixiCanvas`
(client-only, WebGL/SSR fallback, lazy), wrapped by a `components/<Name>.tsx` island that owns state +
audio. **To add one:** copy `strum-scene.tsx` + `StrumPattern.tsx`; add the `tool` id to `main.tsp`
(`spec:generate`), the domain `ContentEmbed`, and the build `EMBED_TOOLS`; add a `case` + `DEFAULT_TITLE`
entry in `ContentEmbeds`, and an `embed.<tool>` i18n key.

- **Chord vocabulary:** guitar/ukulele shapes come from `@TheY2T/tmr-ui/music` (`GUITAR_CHORDS`,
  `UKULELE_CHORDS`). Covered: majors/minors C A G E D Am Em Dm F Bm + open 7ths A7 D7 E7 C7 G7 B7 (guitar);
  C G F D A Am Em Dm C7 G7 D7 (ukulele). An unknown symbol renders as a plain label — add the shape to
  the library if a lesson needs it.
- **`score` is the workhorse** — anything you can write in alphaTex (see the `add-score` skill) can be
  embedded inline, playable, without a media asset. Prefer it whenever a lesson is best shown as notation.

## Full tool catalogue (for linking / future embeds)

Every tool is a `/tools/<slug>` island (flag-gated `tools.*`). Only the six above are wired for embeds;
the rest are generic playgrounds (no props / no query-param preload) — link to them in prose, or add
props + an embed mapping to make one embeddable.

- **Keyboard/fretboard:** keyboard, soundfont (`PianoKeyboard`); fretboard (`GuitarFretboard`);
  chord-diagrams; chord-dictionary (`ChordDictionary`); caged (`CagedExplorer`); scale-boxes; voicings (`VoicingLibrary`).
- **Theory/harmony:** circle-of-fifths; scale-explorer; chords (`ChordBuilder`); chord-identifier; modes;
  progression; intervals; analyzer (`ChordAnalyzer`); transposer.
- **Ear/quizzes:** ear-trainer; progression-ear; chord-quality-ear; fret-quiz; melodic-dictation;
  rhythm-dictation; solfege; key-quiz; interval-quiz.
- **Rhythm/time:** metronome; tuner (`TuningReference`); sequencer (`BeatSequencer`); rhythm
  (`RhythmTrainer`); grooves.
- **Reading/notation:** score (`ScoreRenderer` alphaTex playground); musicxml; multi-voice; player
  (`NotationPlayer`); sight-reading; staff (`StaffReader`).
- **Play/practice:** backing-track; licks (`LickLibrary`); strumming; fingerpicking; arpeggio;
  progression-player; practice-player; practice-room; bassline.

## Worked examples

Scale shapes (guitar):
```embeds
[{ "tool": "scale-boxes", "title": "The five shapes", "caption": "A minor pentatonic — move the box to change key.", "root": "A", "scale": "minor-pentatonic" }]
```

Ukulele chords:
```embeds
[{ "tool": "chord-diagrams", "title": "Your first four chords", "instrument": "ukulele", "chords": ["C","G","Am","F"] }]
```

12-bar blues (diagrams + playback):
```embeds
[
  { "tool": "chord-diagrams", "title": "The three chords", "chords": ["A7","D7","E7"] },
  { "tool": "progression", "title": "Play the 12-bar form", "key": "A", "chords": ["A7","A7","A7","A7","D7","D7","A7","A7","E7","D7","A7","E7"] }
]
```

Diatonic chords as playable notation (theory):
```embeds
[{ "tool": "score", "title": "The seven triads of C major", "tex": "\\title \"Diatonic triads\" .\n(c4 e4 g4) (d4 f4 a4) (e4 g4 b4) (f4 a4 c5) (g4 b4 d5) (a4 c5 e5) (b4 d5 f5) |" }]
```

## Rules

- **One source of truth:** author embeds in the content `.md`, never hand-edit `seed-content.ts`.
- **Preconfigure to the article** — bind `root`/`scale`/`chords`/`tex` to the lesson's actual subject so
  the tool implements *this* lesson, not a blank playground.
- **Prose:** don't leave bare `/tools/x` paths in the body — either embed the tool or write a real
  Markdown link. Reword "try it on /tools/…" to point at the embedded tool below.
- **i18n/theme:** the renderer is theme-token + i18n driven; embed `title`/`caption` are author prose
  (English in the `.md`; they are not run through `t()`), so keep them short and clear.
- After authoring: `content:build`, then **`scores:validate`** (it parses inline `score` embed `tex`
  through alphaTab, as well as `.alphatex` media files — a broken inline score fails the gate), reseed,
  and verify in the browser. Run `scores:build` too if you added `score` **media** files.
