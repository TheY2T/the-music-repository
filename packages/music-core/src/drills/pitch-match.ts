/** Pure pitch-matching helpers for the sing/mic drills — no Web Audio, unit-testable. */

import { hzToNote } from '../pitch-detection';

/**
 * The pitch class (0–11) of a detected frequency, or null. `maxCents` rejects ambiguous readings near
 * the midpoint between two semitones (|cents| close to 50) — so a wavering or between-notes voice
 * doesn't submit a coin-flip pitch.
 */
export function detectedPitchClass(hz: number | null, maxCents = 45): number | null {
  if (hz == null) {
    return null;
  }
  const note = hzToNote(hz);
  if (Math.abs(note.cents) > maxCents) {
    return null;
  }
  return ((note.midi % 12) + 12) % 12;
}

/**
 * The pitch class the singer is holding: returns it only when the last `frames` readings are all the
 * same non-null pitch class (a stable, sustained note), else null. Debounces momentary detections.
 */
export function sustainedPitchClass(
  readings: readonly (number | null)[],
  frames: number,
): number | null {
  if (readings.length < frames) {
    return null;
  }
  const recent = readings.slice(-frames);
  const first = recent[0];
  if (first == null) {
    return null;
  }
  return recent.every((r) => r === first) ? first : null;
}
