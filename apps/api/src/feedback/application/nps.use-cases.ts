import { UnprocessableError } from '@TheY2T/tmr-errors';
import { Injectable } from '@nestjs/common';
import { computeNpsAnalytics, type NpsAnalyticsView } from '../domain/nps';
import { NpsRepository } from './ports/nps-repository.port';

/** NPS eligibility windows (best-practice relational NPS: activated users, ~quarterly). */
export const NPS_ACTIVATION_MIN_DAYS = 30;
export const NPS_RESPONSE_COOLDOWN_DAYS = 90;
export const NPS_DISMISS_COOLDOWN_DAYS = 30;
/** Re-prompt window after merely showing (without a response/dismiss) — avoids nagging every session. */
export const NPS_SHOWN_COOLDOWN_DAYS = 7;

/** Staff roles are excluded from the survey so internal use never skews the score. */
const EXCLUDED_ROLES = new Set(['admin', 'editor']);

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS;
}

export class NpsScoreOutOfRangeError extends UnprocessableError {
  readonly code = 'NPS_SCORE_OUT_OF_RANGE';
  constructor(score: number) {
    super(`NPS score must be an integer between 0 and 10 (received ${score}).`, { score });
  }
}

@Injectable()
export class NpsEligibilityUseCase {
  constructor(private readonly repository: NpsRepository) {}

  /**
   * Whether to show the NPS prompt to this user now. When eligible, stamps `last_shown_at` so
   * re-checks within {@link NPS_SHOWN_COOLDOWN_DAYS} return false.
   */
  async execute(
    userId: string,
    roles: readonly string[],
    now: Date = new Date(),
  ): Promise<boolean> {
    if (roles.some((role) => EXCLUDED_ROLES.has(role))) {
      return false;
    }
    const createdAt = await this.repository.getAccountCreatedAt(userId);
    if (!createdAt || daysBetween(createdAt, now) < NPS_ACTIVATION_MIN_DAYS) {
      return false;
    }
    const state = await this.repository.getPromptState(userId);
    if (state) {
      if (
        state.lastRespondedAt &&
        daysBetween(state.lastRespondedAt, now) < NPS_RESPONSE_COOLDOWN_DAYS
      ) {
        return false;
      }
      if (
        state.lastDismissedAt &&
        daysBetween(state.lastDismissedAt, now) < NPS_DISMISS_COOLDOWN_DAYS
      ) {
        return false;
      }
      if (state.lastShownAt && daysBetween(state.lastShownAt, now) < NPS_SHOWN_COOLDOWN_DAYS) {
        return false;
      }
    }
    await this.repository.markShown(userId);
    return true;
  }
}

@Injectable()
export class SubmitNpsUseCase {
  constructor(private readonly repository: NpsRepository) {}

  async execute(
    userId: string,
    score: number,
    comment: string | null,
    source: string | null,
  ): Promise<void> {
    if (!Number.isInteger(score) || score < 0 || score > 10) {
      throw new NpsScoreOutOfRangeError(score);
    }
    const trimmedComment = comment?.trim() || null;
    await this.repository.recordResponse(userId, score, trimmedComment, source?.trim() || null);
  }
}

@Injectable()
export class DismissNpsUseCase {
  constructor(private readonly repository: NpsRepository) {}
  execute(userId: string): Promise<void> {
    return this.repository.markDismissed(userId);
  }
}

@Injectable()
export class ListNpsResponsesUseCase {
  constructor(private readonly repository: NpsRepository) {}
  execute(page: number, pageSize: number) {
    return this.repository.listResponses(page, pageSize);
  }
}

@Injectable()
export class NpsAnalyticsUseCase {
  constructor(private readonly repository: NpsRepository) {}
  async execute(from: Date | null, to: Date | null): Promise<NpsAnalyticsView> {
    const points = await this.repository.scorePointsInRange(from, to);
    return computeNpsAnalytics(points);
  }
}
