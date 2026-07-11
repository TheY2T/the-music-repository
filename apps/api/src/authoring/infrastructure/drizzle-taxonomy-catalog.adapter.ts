import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { TaxonomyRef } from '../../catalogue/domain/content-item';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { genres, instruments, skillTopics, tags } from '../../infrastructure/database/schema';
import type { TaxonomyDimension } from '../application/ports/taxonomy-catalog.port';
import { TaxonomyCatalog } from '../application/ports/taxonomy-catalog.port';
import { InvalidTaxonomyDimensionError } from '../domain/errors/invalid-taxonomy-dimension.error';

// biome-ignore lint/suspicious/noExplicitAny: the four taxonomy tables share {id,slug,name} but differ by type.
const DIMENSION_TABLES: Record<TaxonomyDimension, any> = {
  genres,
  instruments,
  topics: skillTopics,
  tags,
};

@Injectable()
export class DrizzleTaxonomyCatalog extends TaxonomyCatalog {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async list(dimension: TaxonomyDimension): Promise<TaxonomyRef[]> {
    const table = this.tableFor(dimension);
    const rows = await this.db
      .select({ slug: table.slug, name: table.name })
      .from(table)
      .orderBy(asc(table.name));
    return rows as TaxonomyRef[];
  }

  async upsert(dimension: TaxonomyDimension, term: TaxonomyRef): Promise<TaxonomyRef> {
    const table = this.tableFor(dimension);
    await this.db
      .insert(table)
      .values({ slug: term.slug, name: term.name })
      .onConflictDoUpdate({ target: table.slug, set: { name: term.name } });
    return term;
  }

  // biome-ignore lint/suspicious/noExplicitAny: returns one of the shared-shape taxonomy tables.
  private tableFor(dimension: TaxonomyDimension): any {
    const table = DIMENSION_TABLES[dimension];
    if (!table) {
      throw new InvalidTaxonomyDimensionError(dimension);
    }
    return table;
  }
}
