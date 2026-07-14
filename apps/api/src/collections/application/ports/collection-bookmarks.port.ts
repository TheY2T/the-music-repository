/**
 * CollectionBookmarks (DDD) — a signed-in user's saved collections. Speaks in collection slugs;
 * the adapter resolves slug → id. Mirrors the catalogue `FavoritesRepository`.
 */
export abstract class CollectionBookmarks {
  /** Idempotent. Throws CollectionNotFoundError if the slug doesn't exist. */
  abstract add(userId: string, slug: string): Promise<void>;
  abstract remove(userId: string, slug: string): Promise<void>;
  /** Bookmarked collection slugs, most-recently-added first. */
  abstract listSlugs(userId: string): Promise<string[]>;
}
