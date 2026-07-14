import { Injectable } from '@nestjs/common';
import { type CollectionSummaryView, toCollectionSummaryView } from '../../domain/collection';
import { CollectionRatings } from '../ports/collection-ratings.port';
import { CollectionRepository } from '../ports/collection-repository.port';

@Injectable()
export class ListCollectionsUseCase {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly ratings: CollectionRatings,
  ) {}

  /** Public browse: published editorial + public collections, with aggregate ratings. */
  async execute(): Promise<CollectionSummaryView[]> {
    const collections = (await this.repository.findAllPublished()).filter(
      (c) => c.visibility !== 'private',
    );
    const aggregate = await this.ratings.getAggregate(collections.map((c) => c.slug));
    return collections.map((c) => toCollectionSummaryView(c, aggregate.get(c.slug)));
  }
}

@Injectable()
export class ListCollectionsAdminUseCase {
  constructor(private readonly repository: CollectionRepository) {}

  /** Admin: every collection, any status. */
  async execute(): Promise<CollectionSummaryView[]> {
    const collections = await this.repository.listAll();
    return collections.map((c) => toCollectionSummaryView(c));
  }
}
