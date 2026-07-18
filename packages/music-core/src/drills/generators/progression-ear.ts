/** Progression-ear deck: hear a diatonic chord progression, identify it by its Roman numerals. */

import { PROGRESSION_TEMPLATES, realizeProgression } from '../../progressions';
import type { DrillItemGenerator, DrillOption } from '../drill-types';
import { randomInt } from '../drill-types';
import { BASE_MIDI, chordsToNotes, exactMatch } from './shared';

// A curated set of common beginner progressions with distinct labels (the MC options).
const DECK_KEYS = ['pop-axis', 'pop-doowop', 'pop-sensitive', 'folk-145', 'classical-cadence'];
const TEMPLATES = DECK_KEYS.map((key) => PROGRESSION_TEMPLATES.find((t) => t.key === key)).filter(
  (t): t is (typeof PROGRESSION_TEMPLATES)[number] => t != null,
);
const OPTIONS: DrillOption[] = TEMPLATES.map((t) => ({ value: t.label, label: t.label }));

export const progressionEarDeck: DrillItemGenerator<string> = {
  deck: 'progression-ear',
  modality: 'ear-identify',
  cards: TEMPLATES.map((t) => t.key),
  generate(card, _level, rng) {
    const template = TEMPLATES.find((t) => t.key === card) ?? TEMPLATES[0];
    const keyRoot = randomInt(0, 12, rng);
    const chords = realizeProgression(keyRoot, template, false);
    return {
      card,
      modality: 'ear-identify',
      level: template.level,
      presentation: { kind: 'audio', notes: chordsToNotes(chords, BASE_MIDI) },
      expected: template.label,
      options: OPTIONS,
      answerLabel: template.label,
    };
  },
  check: exactMatch,
};
