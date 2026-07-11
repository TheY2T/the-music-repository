/**
 * FavoritesRepository (DDD) — the personalization requirement: persist a user's content bookmarks.
 * Speaks in content slugs (domain-facing); the adapter resolves slug → id.
 */
export abstract class FavoritesRepository {
  /** Idempotent. Throws ContentNotFoundError if the slug doesn't exist. */
  abstract add(userId: string, slug: string): Promise<void>;
  abstract remove(userId: string, slug: string): Promise<void>;
  /** Favorited slugs, most-recently-added first. */
  abstract listSlugs(userId: string): Promise<string[]>;
}
