import type { CollectionRatingAggregate } from '../../domain/collection';

/**
 * CollectionRatings (DDD) — a user's 1..5 rating of a collection, plus aggregate reads for discovery.
 * Speaks in collection slugs; the adapter resolves slug → id.
 */
export abstract class CollectionRatings {
  /** Upsert the acting user's rating. Throws CollectionNotFoundError if the slug doesn't exist. */
  abstract rate(userId: string, slug: string, value: number): Promise<void>;
  abstract getUserRating(userId: string, slug: string): Promise<number | null>;
  /** Aggregate (avg + count) keyed by collection slug, for the given slugs. */
  abstract getAggregate(slugs: string[]): Promise<Map<string, CollectionRatingAggregate>>;
}
