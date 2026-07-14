import type { Collection, CollectionRatingAggregate } from '../../domain/collection';
import type { CollectionSearchQuery, CollectionSearchResult } from '../../domain/collection-search';

/** CollectionSearchIndex — faceted discovery over the collections catalogue (Meilisearch adapter). */
export abstract class CollectionSearchIndex {
  abstract search(query: CollectionSearchQuery): Promise<CollectionSearchResult>;
  /** Rebuild the index from the given collections + their aggregate ratings (by slug). */
  abstract indexAll(
    collections: Collection[],
    ratings: Map<string, CollectionRatingAggregate>,
  ): Promise<void>;
}
