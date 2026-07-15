/**
 * Pure rhythm helpers for the `rhythm` content embed. A note-value token maps to a duration in beats
 * (quarter = 1) and a short display label. Framework-free + unit-tested; the Pixi scene sizes blocks by
 * {@link BEATS} and the island schedules a click per onset.
 */

/** Note-value token → duration in beats (quarter note = 1). */
export const BEATS: Record<string, number> = {
  whole: 4,
  'dotted-half': 3,
  half: 2,
  'dotted-quarter': 1.5,
  quarter: 1,
  'dotted-eighth': 0.75,
  eighth: 0.5,
  sixteenth: 0.25,
};

const LABELS: Record<string, string> = {
  whole: 'whole',
  'dotted-half': 'dotted ½',
  half: 'half',
  'dotted-quarter': 'dotted ¼',
  quarter: 'quarter',
  'dotted-eighth': 'dotted ♪',
  eighth: '8th',
  sixteenth: '16th',
};

/** Short display label for a note-value token (falls back to the token itself). */
export function valueLabel(token: string): string {
  return LABELS[token] ?? token;
}

/** Beats for a token (default 1 = quarter). */
export function beatsFor(token: string): number {
  return BEATS[token] ?? 1;
}
