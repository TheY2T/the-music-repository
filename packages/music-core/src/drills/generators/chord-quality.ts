/** Chord-quality deck: hear a block chord, name its quality (ear-identify). */

import { chordsByLevel } from '../../music-theory';
import type { DrillItemGenerator, DrillOption } from '../drill-types';
import { randomInt } from '../drill-types';
import { BASE_MIDI, exactMatch } from './shared';

// Beginner + intermediate qualities only — the advanced/extended chords are too fine-grained to
// distinguish by ear in a recognition drill (matches the legacy deck's `chordsByLevel('intermediate')`).
const CHORD_DECK = chordsByLevel('intermediate');
const OPTIONS: DrillOption[] = CHORD_DECK.map((chord) => ({
  value: chord.name,
  label: chord.name,
}));

export const chordQualityDeck: DrillItemGenerator<string> = {
  deck: 'chord-quality',
  modality: 'ear-identify',
  cards: CHORD_DECK.map((chord) => chord.key),
  generate(card, _level, rng) {
    const chord = CHORD_DECK.find((c) => c.key === card) ?? CHORD_DECK[0];
    const root = BASE_MIDI + randomInt(0, 12, rng);
    return {
      card,
      modality: 'ear-identify',
      level: chord.level,
      presentation: {
        kind: 'audio',
        notes: chord.intervals.map((interval) => ({
          midi: root + interval,
          atMs: 0,
          durationMs: 1100,
        })),
      },
      expected: chord.name,
      options: OPTIONS,
      answerLabel: chord.name,
    };
  },
  check: exactMatch,
};
