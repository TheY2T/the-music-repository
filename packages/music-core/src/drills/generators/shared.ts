/** Shared helpers for the string-answer drill generators (multiple-choice / ear-identify). */

import type { AttemptScore, DrillItem, DrillOption } from '../drill-types';

/** Fisher–Yates shuffle using an injected `rng` (deterministic in tests). */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build MC options: the correct one plus up to `count - 1` distinct distractors, shuffled. */
export function sampleOptions(
  correct: DrillOption,
  pool: readonly DrillOption[],
  count: number,
  rng: () => number,
): DrillOption[] {
  const distractors = shuffle(
    pool.filter((o) => o.value !== correct.value),
    rng,
  ).slice(0, Math.max(0, count - 1));
  return shuffle([correct, ...distractors], rng);
}

/** Exact-match objective check for string-answer drills. */
export function exactMatch(item: DrillItem<string>, response: string): AttemptScore {
  const correct = response === item.expected;
  return { accuracy: correct ? 1 : 0, correct };
}

/** Root MIDI for generated prompts — C3, matching the legacy decks' `BASE_MIDI`. */
export const BASE_MIDI = 48;
