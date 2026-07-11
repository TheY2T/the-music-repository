import type { TaxonomyRef } from '../../../catalogue/domain/content-item';

export type TaxonomyDimension = 'genres' | 'instruments' | 'topics' | 'tags';

export const TAXONOMY_DIMENSIONS: readonly TaxonomyDimension[] = [
  'genres',
  'instruments',
  'topics',
  'tags',
];

/** TaxonomyCatalog — manage the controlled vocabularies used to tag content. */
export abstract class TaxonomyCatalog {
  abstract list(dimension: TaxonomyDimension): Promise<TaxonomyRef[]>;
  abstract upsert(dimension: TaxonomyDimension, term: TaxonomyRef): Promise<TaxonomyRef>;
}
