import type { AttemptOutcome } from '../../domain/mastery';

/** A stored drill attempt (as read back for stats). */
export interface StoredAttempt extends AttemptOutcome {
  deck: string;
  createdAt: Date;
}

/** One attempt to persist. */
export interface AttemptRecord {
  deck: string;
  card: string;
  modality: string;
  accuracy: number;
  correct: boolean;
  responseMs?: number;
}

/**
 * AttemptLog — the drill engine's requirement: durably record objective attempts and read them back
 * for per-skill mastery + streak stats. (SM-2 scheduling is a separate capability, owned by reviews.)
 */
export abstract class AttemptLog {
  abstract record(userId: string, at: Date, attempt: AttemptRecord): Promise<void>;
  /** All attempts for a deck (chronological), for mastery of a single skill. */
  abstract listDeck(userId: string, deck: string): Promise<StoredAttempt[]>;
  /** All attempts across every deck (chronological), for the stats summary. */
  abstract listAll(userId: string): Promise<StoredAttempt[]>;
  /** Distinct `YYYY-MM-DD` attempt-activity keys (for streaks). */
  abstract activityDateKeys(userId: string): Promise<string[]>;
  /** Number of attempts since the start of the current UTC day. */
  abstract attemptsToday(userId: string, now: Date): Promise<number>;
}
