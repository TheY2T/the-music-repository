import { Injectable } from '@nestjs/common';
import type { CatalogueQuery, CatalogueResult } from '../../domain/content-item';
import { CatalogueSearch } from '../ports/catalogue-search.port';

@Injectable()
export class SearchCatalogueUseCase {
  constructor(private readonly search: CatalogueSearch) {}

  execute(query: CatalogueQuery): Promise<CatalogueResult> {
    return this.search.search(query);
  }
}
