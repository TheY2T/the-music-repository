import type { CatalogueQuery, CatalogueResult, ContentItem } from '../../domain/content-item';

/** CatalogueSearch — the application's requirement: browse/search the catalogue with facets. */
export abstract class CatalogueSearch {
  abstract search(query: CatalogueQuery): Promise<CatalogueResult>;
  abstract indexAll(items: ContentItem[]): Promise<void>;
}
