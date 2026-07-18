/** Interval-recognition deck: hear two notes, name the interval (ear-identify). */

import { INTERVAL_NAMES } from '../../music-theory';
import type { DrillItemGenerator, DrillOption } from '../drill-types';
import { randomInt } from '../drill-types';
import { BASE_MIDI, exactMatch } from './shared';

const OPTIONS: DrillOption[] = INTERVAL_NAMES.map((name) => ({ value: name, label: name }));

export const intervalsDeck: DrillItemGenerator<string> = {
  deck: 'intervals',
  modality: 'ear-identify',
  // Card key = semitone count, matching the legacy `intervals` deck (SM-2 continuity).
  cards: INTERVAL_NAMES.map((_, semitones) => String(semitones)),
  generate(card, _level, rng) {
    const semitones = Number(card);
    const root = BASE_MIDI + randomInt(0, 24, rng);
    const name = INTERVAL_NAMES[semitones];
    return {
      card,
      modality: 'ear-identify',
      level: 'beginner',
      presentation: {
        kind: 'audio',
        notes: [
          { midi: root, atMs: 0, durationMs: 700 },
          { midi: root + semitones, atMs: 550, durationMs: 700 },
        ],
      },
      expected: name,
      options: OPTIONS,
      answerLabel: name,
    };
  },
  check: exactMatch,
};
