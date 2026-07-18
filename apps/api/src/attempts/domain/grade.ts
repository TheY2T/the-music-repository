/**
 * Map an objective drill outcome to an SM-2 recall quality (0–5) — pure, framework-free.
 *
 * The landmarks reproduce the old manual self-grade UI (Again = 2, Good = 4, Easy = 5) so SM-2
 * scheduling stays continuous for decks reviewed before objective grading existed. A partial pass
 * (0.5 ≤ accuracy < 1, e.g. a rhythm tapped mostly in time) emits quality 3 — a path the old 3-button
 * UI never produced, but `applySm2` handles correctly.
 */

export interface GradeInput {
  accuracy: number;
  responseMs?: number;
  expectedMs?: number;
}

export function accuracyToQuality({ accuracy, responseMs, expectedMs }: GradeInput): number {
  if (accuracy < 0.5) {
    return 2;
  }
  if (accuracy < 1) {
    return 3;
  }
  const fast = responseMs != null && expectedMs != null && responseMs <= expectedMs;
  return fast ? 5 : 4;
}
