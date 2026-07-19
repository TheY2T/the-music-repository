import type { NpsPromptState, NpsResponseView, NpsScorePoint } from '../../domain/nps';

export interface NpsResponsePage {
  items: NpsResponseView[];
  total: number;
}

/** NpsRepository (DDD) — persist/read NPS responses and per-user prompt throttle state. */
export abstract class NpsRepository {
  /** When the user's account was created (for the activation window); null if unknown. */
  abstract getAccountCreatedAt(userId: string): Promise<Date | null>;
  abstract getPromptState(userId: string): Promise<NpsPromptState | null>;
  /** Upsert `last_shown_at = now` for the user. */
  abstract markShown(userId: string): Promise<void>;
  /** Upsert `last_dismissed_at = now` for the user. */
  abstract markDismissed(userId: string): Promise<void>;
  /** Record a response and stamp `last_responded_at = now`. */
  abstract recordResponse(
    userId: string,
    score: number,
    comment: string | null,
    source: string | null,
  ): Promise<void>;

  abstract listResponses(page: number, pageSize: number): Promise<NpsResponsePage>;
  /** Raw score points within an optional inclusive date range, for aggregation. */
  abstract scorePointsInRange(from: Date | null, to: Date | null): Promise<NpsScorePoint[]>;
}
