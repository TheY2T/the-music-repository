import { Injectable } from '@nestjs/common';
import type { TaxonomyRef } from '../../../catalogue/domain/content-item';
import { InvalidTaxonomyDimensionError } from '../../domain/errors/invalid-taxonomy-dimension.error';
import {
  TAXONOMY_DIMENSIONS,
  TaxonomyCatalog,
  type TaxonomyDimension,
} from '../ports/taxonomy-catalog.port';

@Injectable()
export class ListTaxonomyUseCase {
  constructor(private readonly taxonomy: TaxonomyCatalog) {}

  execute(dimension: string): Promise<TaxonomyRef[]> {
    return this.taxonomy.list(assertDimension(dimension));
  }
}

/** Validate the path segment before it reaches the adapter. */
export function assertDimension(dimension: string): TaxonomyDimension {
  if (!(TAXONOMY_DIMENSIONS as readonly string[]).includes(dimension)) {
    throw new InvalidTaxonomyDimensionError(dimension);
  }
  return dimension as TaxonomyDimension;
}
