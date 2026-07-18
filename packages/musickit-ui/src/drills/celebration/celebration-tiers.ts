/**
 * The celebration hierarchy — the single source of truth for which reward fires at which trigger.
 * Keeping this a pure config (not effects scattered through the session) is what lets us "reserve
 * intensity for rarity": a lower tier can never borrow a higher tier's effect. Tiers 2–4 land in
 * later phases; Phase 0 wires Tier 1 (micro) + the correct/wrong particle burst.
 */

/** Consecutive-correct counts that earn an escalating combo celebration (Tier 2). */
export const COMBO_THRESHOLDS = [5, 10, 20] as const;

/** Accuracy tiers (0–1) → star rating for a completed session (Tier 3). */
export const STAR_THRESHOLDS = [
  { stars: 3, min: 0.95 },
  { stars: 2, min: 0.85 },
  { stars: 1, min: 0.7 },
  { stars: 0, min: 0 },
] as const;

/** The Tier-1 (per-answer) celebration for a graded response. */
export interface AnswerCelebration {
  /** Particle burst kind (drill-feedback-scene). */
  burst: 'correct' | 'wrong';
  /** Points to pop, or null when wrong. */
  scorePoints: number | null;
  /** Which audio cue to play. */
  chime: 'reward' | 'wrong';
  /** Set to the combo count when it crosses a threshold (Tier 2 hook). */
  comboMilestone: number | null;
}

/** Points awarded for a correct answer: a base plus a capped combo bonus. */
export function pointsForAnswer(combo: number): number {
  return 10 + Math.min(Math.max(combo - 1, 0), 10) * 2;
}

/** The reward config for a single graded answer given the running combo (post-increment). */
export function answerCelebration(correct: boolean, combo: number): AnswerCelebration {
  if (!correct) {
    return { burst: 'wrong', scorePoints: null, chime: 'wrong', comboMilestone: null };
  }
  const comboMilestone = (COMBO_THRESHOLDS as readonly number[]).includes(combo) ? combo : null;
  return {
    burst: 'correct',
    scorePoints: pointsForAnswer(combo),
    chime: 'reward',
    comboMilestone,
  };
}

/** Star rating (0–3) for a session's overall accuracy. */
export function starsForAccuracy(accuracy: number): number {
  return STAR_THRESHOLDS.find((t) => accuracy >= t.min)?.stars ?? 0;
}
