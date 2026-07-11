/** SM-2 spaced-repetition scheduling — pure, framework-free. */

export interface ReviewState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

/** A never-reviewed card: due now, default ease. */
export function defaultReviewState(now: Date): ReviewState {
  return { easeFactor: 2.5, intervalDays: 0, repetitions: 0, dueAt: now };
}

/**
 * Apply an SM-2 recall grade (`quality` 0–5). Grades < 3 lapse the card (reset reps, review again
 * tomorrow); grades ≥ 3 advance the interval (1 → 6 → previous×ease) and adjust the ease factor.
 */
export function applySm2(state: ReviewState, quality: number, now: Date): ReviewState {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { easeFactor, intervalDays, repetitions } = state;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < MIN_EASE) {
      easeFactor = MIN_EASE;
    }
  }

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: new Date(now.getTime() + intervalDays * MS_PER_DAY),
  };
}
