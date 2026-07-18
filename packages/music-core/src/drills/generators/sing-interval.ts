/**
 * Sing-interval deck (pitch-mic): hear a root, then sing (or play) the note a given interval above it.
 * Answered by the microphone (or the keyboard fallback); checked by pitch class in any octave.
 */

import { INTERVAL_NAMES, pitchName } from '../../music-theory';
import type { DrillItemGenerator } from '../drill-types';
import { randomInt } from '../drill-types';

// Comfortable-to-sing intervals within the octave.
const INTERVALS = [2, 3, 4, 5, 7, 9, 12];
const ROOT_LOW = 57; // A3 — a central singing reference (A3…G♯4).

export const singIntervalDeck: DrillItemGenerator<string> = {
  deck: 'sing-interval',
  modality: 'pitch-mic',
  cards: INTERVALS.map(String),
  generate(card, _level, rng) {
    const semitones = Number(card);
    const root = ROOT_LOW + randomInt(0, 12, rng);
    const targetPc = (root + semitones) % 12;
    return {
      card,
      modality: 'pitch-mic',
      level: 'intermediate',
      presentation: { kind: 'audio', notes: [{ midi: root, atMs: 0, durationMs: 900 }] },
      expected: String(targetPc),
      answerLabel: pitchName(targetPc),
      instruction: {
        key: 'drill.singIntervalAbove',
        params: { interval: INTERVAL_NAMES[semitones] },
      },
    };
  },
  check(item, response) {
    const correct = ((Number(response) % 12) + 12) % 12 === Number(item.expected);
    return { accuracy: correct ? 1 : 0, correct };
  },
};
