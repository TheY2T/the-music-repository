import { Injectable } from '@nestjs/common';
import type { TaxonomyRef } from '../../../catalogue/domain/content-item';
import { TaxonomyCatalog } from '../ports/taxonomy-catalog.port';
import { assertDimension } from './list-taxonomy.use-case';

@Injectable()
export class CreateTaxonomyUseCase {
  constructor(private readonly taxonomy: TaxonomyCatalog) {}

  execute(dimension: string, term: TaxonomyRef): Promise<TaxonomyRef> {
    return this.taxonomy.upsert(assertDimension(dimension), term);
  }
}
