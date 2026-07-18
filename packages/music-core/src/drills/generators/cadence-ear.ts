/** Cadence-ear deck: hear a cadence (in an established key), identify its type. */

import { type ProgressionTemplate, realizeProgression } from '../../progressions';
import type { DrillItemGenerator, DrillOption } from '../drill-types';
import { randomInt } from '../drill-types';
import { BASE_MIDI, chordsToNotes, exactMatch } from './shared';

// Each cadence opens on the tonic (to establish the key) then moves through its defining chords.
const TONIC = { degree: 1, quality: 'major', roman: 'I' };
const CADENCES = [
  {
    key: 'authentic',
    label: 'Authentic (V–I)',
    chords: [
      TONIC,
      { degree: 5, quality: 'major', roman: 'V' },
      { degree: 1, quality: 'major', roman: 'I' },
    ],
  },
  {
    key: 'plagal',
    label: 'Plagal (IV–I)',
    chords: [
      TONIC,
      { degree: 4, quality: 'major', roman: 'IV' },
      { degree: 1, quality: 'major', roman: 'I' },
    ],
  },
  {
    key: 'half',
    label: 'Half (–V)',
    chords: [
      TONIC,
      { degree: 4, quality: 'major', roman: 'IV' },
      { degree: 5, quality: 'major', roman: 'V' },
    ],
  },
  {
    key: 'deceptive',
    label: 'Deceptive (V–vi)',
    chords: [
      TONIC,
      { degree: 5, quality: 'major', roman: 'V' },
      { degree: 6, quality: 'minor', roman: 'vi' },
    ],
  },
];
const OPTIONS: DrillOption[] = CADENCES.map((c) => ({ value: c.label, label: c.label }));

export const cadenceEarDeck: DrillItemGenerator<string> = {
  deck: 'cadence-ear',
  modality: 'ear-identify',
  cards: CADENCES.map((c) => c.key),
  generate(card, _level, rng) {
    const cadence = CADENCES.find((c) => c.key === card) ?? CADENCES[0];
    const keyRoot = randomInt(0, 12, rng);
    const template: ProgressionTemplate = {
      key: cadence.key,
      label: cadence.label,
      genre: 'cadence',
      level: 'intermediate',
      chords: cadence.chords,
    };
    return {
      card,
      modality: 'ear-identify',
      level: 'intermediate',
      presentation: {
        kind: 'audio',
        notes: chordsToNotes(realizeProgression(keyRoot, template, false), BASE_MIDI),
      },
      expected: cadence.label,
      options: OPTIONS,
      answerLabel: cadence.label,
    };
  },
  check: exactMatch,
};
