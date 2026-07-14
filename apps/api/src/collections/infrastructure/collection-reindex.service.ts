import { Injectable } from '@nestjs/common';
import { CollectionRatings } from '../application/ports/collection-ratings.port';
import { CollectionRepository } from '../application/ports/collection-repository.port';
import { CollectionSearchIndex } from '../application/ports/collection-search.port';

/**
 * Rebuilds the collections search index from Postgres. Called by the seed and after every authoring
 * write. Only published, non-private collections are indexed (enforced in the adapter too).
 */
@Injectable()
export class CollectionReindexService {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly ratings: CollectionRatings,
    private readonly search: CollectionSearchIndex,
  ) {}

  async reindex(): Promise<number> {
    const collections = (await this.repository.findAllPublished()).filter(
      (c) => c.visibility !== 'private',
    );
    const aggregate = await this.ratings.getAggregate(collections.map((c) => c.slug));
    await this.search.indexAll(collections, aggregate);
    return collections.length;
  }
}
