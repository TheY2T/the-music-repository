import { Injectable } from '@nestjs/common';
import { type CollectionSummaryView, toCollectionSummaryView } from '../../domain/collection';
import { CollectionRepository } from '../ports/collection-repository.port';

@Injectable()
export class ListCollectionsUseCase {
  constructor(private readonly repository: CollectionRepository) {}

  /** Public browse: published collections only. */
  async execute(): Promise<CollectionSummaryView[]> {
    const collections = await this.repository.findAllPublished();
    return collections.map(toCollectionSummaryView);
  }
}

@Injectable()
export class ListCollectionsAdminUseCase {
  constructor(private readonly repository: CollectionRepository) {}

  /** Admin: every collection, any status. */
  async execute(): Promise<CollectionSummaryView[]> {
    const collections = await this.repository.listAll();
    return collections.map(toCollectionSummaryView);
  }
}
