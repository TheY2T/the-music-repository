/** Scale-degree deck: hear the tonic then a note, name the scale degree (ear-identify). */

import type { DrillItemGenerator, DrillOption } from '../drill-types';
import { randomInt } from '../drill-types';
import { BASE_MIDI, exactMatch } from './shared';

const SCALE_DEGREES = [
  { semitones: 0, name: '1 (Tonic)' },
  { semitones: 2, name: '2 (Supertonic)' },
  { semitones: 4, name: '3 (Mediant)' },
  { semitones: 5, name: '4 (Subdominant)' },
  { semitones: 7, name: '5 (Dominant)' },
  { semitones: 9, name: '6 (Submediant)' },
  { semitones: 11, name: '7 (Leading tone)' },
];

const OPTIONS: DrillOption[] = SCALE_DEGREES.map((d) => ({ value: d.name, label: d.name }));

export const scaleDegreesDeck: DrillItemGenerator<string> = {
  deck: 'scale-degrees',
  modality: 'ear-identify',
  cards: SCALE_DEGREES.map((d) => String(d.semitones)),
  generate(card, _level, rng) {
    const degree = SCALE_DEGREES.find((d) => String(d.semitones) === card) ?? SCALE_DEGREES[0];
    const tonic = BASE_MIDI + randomInt(0, 12, rng);
    return {
      card,
      modality: 'ear-identify',
      level: 'beginner',
      presentation: {
        kind: 'audio',
        notes: [
          { midi: tonic, atMs: 0, durationMs: 600 },
          { midi: tonic + degree.semitones, atMs: 600, durationMs: 700 },
        ],
      },
      expected: degree.name,
      options: OPTIONS,
      answerLabel: degree.name,
    };
  },
  check: exactMatch,
};
