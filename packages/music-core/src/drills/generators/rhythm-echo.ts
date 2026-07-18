/** Rhythm-echo deck (rhythm-tap): hear a one-bar rhythm, tap it back — graded on timing. */

import type { DrillItemGenerator } from '../drill-types';
import { gradeRhythm, patternOnsets } from '../rhythm-grade';

const BPM = 90;
const TOLERANCE_BEATS = 0.3; // ≈200ms at 90bpm — generous for human tapping.
const PASS = 0.6;

/** Build a 16-step (four-beat, sixteenth-grid) pattern from the hit indices. */
function steps(indices: number[]): boolean[] {
  return Array.from({ length: 16 }, (_, i) => indices.includes(i));
}

// All patterns start on the downbeat (step 0), so the learner's first tap anchors beat 0.
const PATTERNS: { key: string; label: string; steps: boolean[] }[] = [
  { key: 'quarters', label: 'Quarter notes', steps: steps([0, 4, 8, 12]) },
  { key: 'eighths', label: 'Eighth notes', steps: steps([0, 2, 4, 6, 8, 10, 12, 14]) },
  { key: 'half-notes', label: 'Half notes', steps: steps([0, 8]) },
  { key: 'syncopated', label: 'Syncopated', steps: steps([0, 2, 6, 8, 12]) },
  { key: 'gallop', label: 'Gallop', steps: steps([0, 3, 4, 7, 8, 11, 12, 15]) },
];

export const rhythmEchoDeck: DrillItemGenerator<string> = {
  deck: 'rhythm-echo',
  modality: 'rhythm-tap',
  cards: PATTERNS.map((p) => p.key),
  generate(card) {
    const pattern = PATTERNS.find((p) => p.key === card) ?? PATTERNS[0];
    return {
      card,
      modality: 'rhythm-tap',
      level: 'beginner',
      presentation: { kind: 'rhythm', pattern: pattern.steps, bpm: BPM },
      // Expected = the onset beats; the response = the learner's tapped beats (normalized to tap 1).
      expected: patternOnsets(pattern.steps).join(','),
      answerLabel: pattern.label,
      instruction: { key: 'drill.tapRhythm' },
    };
  },
  check(item, response) {
    const expected = item.expected
      .split(',')
      .filter((s) => s !== '')
      .map(Number);
    const taps = response
      .split(',')
      .filter((s) => s !== '')
      .map(Number)
      .filter((n) => Number.isFinite(n));
    const grade = gradeRhythm(expected, taps, TOLERANCE_BEATS);
    return {
      accuracy: grade.accuracy,
      correct: grade.accuracy >= PASS,
      detail: `${grade.matched}/${grade.expected}`,
    };
  },
};
