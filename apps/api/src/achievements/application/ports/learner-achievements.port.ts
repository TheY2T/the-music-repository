import type { Achievements, StoredAchievements } from '../../domain/achievements';

/**
 * LearnerAchievements (ADR 0012 — named for the domain capability) — persist a user's gamification
 * standing (XP + unlocked badges). Speaks in domain terms; the adapter owns the storage.
 */
export abstract class LearnerAchievements {
  /** The user's saved achievements, or `null` when they have never saved any. */
  abstract get(userId: string): Promise<StoredAchievements | null>;
  /** Create or replace the user's achievements (idempotent upsert); returns the stored record. */
  abstract put(userId: string, achievements: Achievements): Promise<StoredAchievements>;
}
