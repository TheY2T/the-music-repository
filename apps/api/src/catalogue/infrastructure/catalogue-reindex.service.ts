import { Injectable } from '@nestjs/common';
import { CatalogueSearch } from '../application/ports/catalogue-search.port';
import { ContentRepository } from '../application/ports/content-repository.port';

/** Rebuilds the search index from Postgres. Called by the seed; and after CMS writes in Slice 2. */
@Injectable()
export class CatalogueReindexService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly search: CatalogueSearch,
  ) {}

  async reindex(): Promise<number> {
    const items = await this.repository.findAllPublished();
    await this.search.indexAll(items);
    return items.length;
  }
}
