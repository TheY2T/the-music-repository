/**
 * ProgressRepository (DDD) — the personalization requirement: track a user's completion + practice.
 * Speaks in content slugs; the adapter resolves slug → id.
 */
export abstract class ProgressRepository {
  /** Idempotent. Throws ContentNotFoundError if the slug doesn't exist. */
  abstract markComplete(userId: string, slug: string): Promise<void>;
  abstract markIncomplete(userId: string, slug: string): Promise<void>;
  abstract listCompletedSlugs(userId: string): Promise<string[]>;
  /** `contentSlug` is optional; an unknown slug is stored as no linked content. */
  abstract logPractice(userId: string, contentSlug: string | null, minutes: number): Promise<void>;
  abstract totalPracticeMinutes(userId: string): Promise<number>;
  /** Distinct `YYYY-MM-DD` activity keys (completions + practice sessions) for the streak. */
  abstract activityDateKeys(userId: string): Promise<string[]>;
}
