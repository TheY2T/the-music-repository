import { Injectable } from '@nestjs/common';
import { type CatalogueQuery, type CatalogueResult, tierRank } from '../../domain/content-item';
import { CatalogueSearch } from '../ports/catalogue-search.port';

@Injectable()
export class SearchCatalogueUseCase {
  constructor(private readonly search: CatalogueSearch) {}

  /** `viewerRank` = the viewer's highest entitlement tier rank (Infinity for staff / gating off). A
   * premium item is `locked` when the viewer's rank is below the item's required tier rank. */
  async execute(query: CatalogueQuery, viewerRank: number): Promise<CatalogueResult> {
    const result = await this.search.search(query);
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        locked: item.visibility === 'premium' && viewerRank < tierRank(item.tier),
      })),
    };
  }
}
