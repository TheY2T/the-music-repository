# Authoring a drill deck

Decks are **code**, not files — a deck is a pure `DrillItemGenerator` in
`packages/music-core/src/drills/generators/`, registered in `generators/index.ts`. The objective drill
engine (flag `trainers.drill-engine`) generates + grades answers; the server only stores SM-2 scheduling,
so **a new deck needs no backend change** (ADR 0014). See `docs/features/drill-engine.md`.

## Add a generator

Create `generators/<deck>.ts` exporting a `DrillItemGenerator` (see `generators/intervals.ts` as the
canonical example):

```ts
export const <name>Deck: DrillItemGenerator<string> = {
  deck: '<stable-id>',            // stable across releases — it is the SM-2 card namespace
  modality: 'ear-identify',       // ear-identify | pitch-match | rhythm-echo | … (see drill-types.ts)
  cards: [...],                   // the card keys (SM-2 continuity — keep keys stable)
  generate(card, level, rng) {    // return one drill item: presentation + expected + options + label
    return { card, modality, level, presentation: {…}, expected, options, answerLabel };
  },
  check: exactMatch,              // or a custom grader from ./shared / a modality grader
};
```

- **Modalities** and item/option types live in `drills/drill-types.ts`. Presentation kinds include `audio`
  (notes with `atMs`/`durationMs`), plus staff/fretboard/pitch/rhythm forms per modality.
- Reuse theory data from `../../music-theory` (INTERVAL_NAMES, SCALES, CHORDS) and helpers from
  `generators/shared.ts` (`BASE_MIDI`, `exactMatch`, `randomInt`).
- Keep `deck` id and `cards` **stable** — they are the SM-2 scheduling keys; changing them resets learners.

## Register + surface

Add the deck to the `DRILL_GENERATORS` array (and the re-export) in `generators/index.ts`. The
`DrillSession` island (`@TheY2T/tmr-musickit-ui`) and `/drills/<deck>` route pick it up via
`findGenerator(deck)`. Attempts record through `@TheY2T/tmr-web-data/drills-api` → `apps/api/src/attempts/`.

## Tests (Definition of Done — `add-tests`)

Unit-test the generator like the existing `generators/*.test.ts`: assert `generate` produces valid items
for each card/level and `check` grades right/wrong answers correctly. Run
`pnpm --filter @TheY2T/tmr-music-core test`.
