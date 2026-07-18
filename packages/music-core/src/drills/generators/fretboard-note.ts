/**
 * Fretboard-note deck (play-instrument): find and play a named note anywhere on the guitar neck. A
 * fretboard-knowledge drill — the answer is any fret of the target pitch class. Reference audio plays
 * the target so the learner can also check by ear.
 */

import { pitchName } from '../../music-theory';
import type { DrillItemGenerator } from '../drill-types';

// Natural notes — the ones a beginner learns first on the neck.
const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11];
const REFERENCE_C = 60; // C4 — the octave the reference tone plays in.

export const fretboardNoteDeck: DrillItemGenerator<string> = {
  deck: 'fretboard-note',
  modality: 'play-instrument',
  cards: NATURAL_PCS.map(String),
  generate(card) {
    const pc = Number(card);
    return {
      card,
      modality: 'play-instrument',
      instrument: 'fretboard',
      level: 'beginner',
      presentation: {
        kind: 'audio',
        notes: [{ midi: REFERENCE_C + pc, atMs: 0, durationMs: 900 }],
      },
      expected: card,
      answerLabel: pitchName(pc),
      instruction: { key: 'drill.playNoteOnFretboard', params: { note: pitchName(pc) } },
    };
  },
  check(item, response) {
    const correct = ((Number(response) % 12) + 12) % 12 === Number(item.expected);
    return { accuracy: correct ? 1 : 0, correct };
  },
};
