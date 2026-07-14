import { Injectable } from '@nestjs/common';
import type { CollectionSearchQuery, CollectionSearchResult } from '../../domain/collection-search';
import { CollectionSearchIndex } from '../ports/collection-search.port';

@Injectable()
export class SearchCollectionsUseCase {
  constructor(private readonly search: CollectionSearchIndex) {}

  execute(query: CollectionSearchQuery): Promise<CollectionSearchResult> {
    return this.search.search(query);
  }
}
