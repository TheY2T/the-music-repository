import { Injectable } from '@nestjs/common';
import type { CatalogueQuery, CatalogueResult } from '../../domain/content-item';
import { CatalogueSearch } from '../ports/catalogue-search.port';

@Injectable()
export class SearchCatalogueUseCase {
  constructor(private readonly search: CatalogueSearch) {}

  /** `entitled` = the viewer may access premium content; premium items are flagged `locked` otherwise. */
  async execute(query: CatalogueQuery, entitled: boolean): Promise<CatalogueResult> {
    const result = await this.search.search(query);
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        locked: item.visibility === 'premium' && !entitled,
      })),
    };
  }
}
