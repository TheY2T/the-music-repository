import { Injectable } from '@nestjs/common';
import { GradeCardUseCase } from '../../reviews/application/review.use-cases';
import type { ReviewState } from '../../reviews/domain/sm2';
import { accuracyToQuality } from '../domain/grade';
import { type AttemptOutcome, levelRank, masteryScore, masteryToLevel } from '../domain/mastery';
import { AttemptLog, type AttemptRecord } from './ports/attempt-log';

/** The deck's "comfortable" response budget — a faster full-correct answer earns Easy over Good. */
const DEFAULT_EXPECTED_MS = 4000;
/** Only call a rising mastery a "personal best" once there's enough history to be meaningful. */
const MIN_ATTEMPTS_FOR_BEST = 3;

export interface DrillAttemptResult {
  state: ReviewState;
  quality: number;
  isPersonalBest: boolean;
  /** The deck's mastery level after this attempt. */
  level: string;
  /** True when this attempt advanced the deck to a higher mastery level. */
  leveledUp: boolean;
}

/**
 * Record an objective drill attempt: persist it, map its accuracy to an SM-2 quality, and delegate
 * scheduling to the reviews context (which also logs the review for streaks — so we never double-write).
 */
@Injectable()
export class RecordDrillAttemptUseCase {
  constructor(
    private readonly attempts: AttemptLog,
    private readonly gradeCard: GradeCardUseCase,
  ) {}

  async execute(userId: string, attempt: AttemptRecord): Promise<DrillAttemptResult> {
    const now = new Date();
    await this.attempts.record(userId, now, attempt);

    const quality = accuracyToQuality({
      accuracy: attempt.accuracy,
      responseMs: attempt.responseMs,
      expectedMs: DEFAULT_EXPECTED_MS,
    });
    const state = await this.gradeCard.execute(userId, attempt.deck, attempt.card, quality);

    // Read the deck's attempts (including the one just recorded) once, and derive the reward signals.
    const outcomes = await this.attempts.listDeck(userId, attempt.deck);
    const after = masteryScore(outcomes);
    const before = masteryScore(outcomes.slice(0, -1));
    const level = masteryToLevel(after);

    return {
      state,
      quality,
      isPersonalBest: this.isPersonalBest(outcomes),
      level,
      leveledUp: levelRank(level) > levelRank(masteryToLevel(before)),
    };
  }

  /** A new best = this attempt pushed the deck's rolling mastery strictly above its prior peak. */
  private isPersonalBest(outcomes: AttemptOutcome[]): boolean {
    if (outcomes.length < MIN_ATTEMPTS_FOR_BEST) {
      return false;
    }
    const current = masteryScore(outcomes);
    const priorPeak = Math.max(
      ...outcomes.slice(0, -1).map((_, i) => masteryScore(outcomes.slice(0, i + 1))),
    );
    return current > priorPeak;
  }
}
