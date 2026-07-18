/**
 * Build-interval deck (play-instrument): hear a root note, then play the note a given interval above it.
 * A relative-pitch drill — the root is the tonal anchor, so it's learnable without perfect pitch. The
 * answer is checked by pitch class (any octave counts).
 */

import { INTERVAL_NAMES, pitchName } from '../../music-theory';
import type { DrillItemGenerator } from '../drill-types';
import { randomInt } from '../drill-types';

// Ascending intervals within the octave (skip unison — nothing to "build").
const INTERVALS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const ROOT_LOW = 60; // C4 — a comfortable reference range (C4…B4).

export const buildIntervalDeck: DrillItemGenerator<string> = {
  deck: 'build-interval',
  modality: 'play-instrument',
  cards: INTERVALS.map(String),
  generate(card, _level, rng) {
    const semitones = Number(card);
    const root = ROOT_LOW + randomInt(0, 12, rng);
    const targetPc = (root + semitones) % 12;
    return {
      card,
      modality: 'play-instrument',
      level: 'beginner',
      presentation: { kind: 'audio', notes: [{ midi: root, atMs: 0, durationMs: 900 }] },
      // Expected + response are pitch-class strings (0–11); the instrument input reports `midi % 12`.
      expected: String(targetPc),
      answerLabel: pitchName(targetPc),
      instruction: {
        key: 'drill.playIntervalAbove',
        params: { interval: INTERVAL_NAMES[semitones] },
      },
    };
  },
  check(item, response) {
    const correct = ((Number(response) % 12) + 12) % 12 === Number(item.expected);
    return { accuracy: correct ? 1 : 0, correct };
  },
};
