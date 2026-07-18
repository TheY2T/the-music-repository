/** Per-skill mastery — pure, framework-free. Mastery is an EWMA of attempt correctness (0–1). */

export type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** Attempt correctness in chronological order (oldest → newest). */
export interface AttemptOutcome {
  correct: boolean;
  accuracy: number;
}

/** Smoothing factor for the mastery EWMA — higher weights recent attempts more. */
const EWMA_ALPHA = 0.3;

/** Accuracy-gated level thresholds on the mastery score. */
const LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: 'expert', min: 0.95 },
  { level: 'advanced', min: 0.85 },
  { level: 'intermediate', min: 0.7 },
  { level: 'beginner', min: 0 },
];

export interface SkillMastery {
  deck: string;
  attempts: number;
  /** Mean accuracy over the counted attempts (0–1). */
  accuracy: number;
  /** EWMA of accuracy, weighting recent attempts (0–1). */
  mastery: number;
  level: Level;
}

/** EWMA of accuracy over attempts in chronological order. Empty → 0. */
export function masteryScore(outcomes: AttemptOutcome[]): number {
  let ewma: number | null = null;
  for (const outcome of outcomes) {
    ewma =
      ewma === null ? outcome.accuracy : EWMA_ALPHA * outcome.accuracy + (1 - EWMA_ALPHA) * ewma;
  }
  return ewma ?? 0;
}

/** The level a learner has earned at a given mastery score (accuracy-gated advancement). */
export function masteryToLevel(mastery: number): Level {
  return (LEVEL_THRESHOLDS.find((t) => mastery >= t.min) ?? LEVEL_THRESHOLDS.at(-1))
    ?.level as Level;
}

/** Fold a deck's attempts (chronological) into a mastery summary. */
export function summarizeDeck(deck: string, outcomes: AttemptOutcome[]): SkillMastery {
  const attempts = outcomes.length;
  const accuracy = attempts === 0 ? 0 : outcomes.reduce((s, o) => s + o.accuracy, 0) / attempts;
  const mastery = masteryScore(outcomes);
  return { deck, attempts, accuracy, mastery, level: masteryToLevel(mastery) };
}
