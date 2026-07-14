import { Inject, Injectable } from '@nestjs/common';
import { and, avg, count, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { collectionRatings, collections } from '../../infrastructure/database/schema';
import { CollectionRatings } from '../application/ports/collection-ratings.port';
import type { CollectionRatingAggregate } from '../domain/collection';
import { CollectionNotFoundError } from '../domain/errors/collection-not-found.error';

@Injectable()
export class DrizzleCollectionRatings extends CollectionRatings {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async rate(userId: string, slug: string, value: number): Promise<void> {
    const collectionId = await this.idBySlug(slug);
    if (!collectionId) {
      throw new CollectionNotFoundError(slug);
    }
    await this.db
      .insert(collectionRatings)
      .values({ userId, collectionId, rating: value })
      .onConflictDoUpdate({
        target: [collectionRatings.userId, collectionRatings.collectionId],
        set: { rating: value, updatedAt: new Date() },
      });
  }

  async getUserRating(userId: string, slug: string): Promise<number | null> {
    const [row] = await this.db
      .select({ rating: collectionRatings.rating })
      .from(collectionRatings)
      .innerJoin(collections, eq(collectionRatings.collectionId, collections.id))
      .where(and(eq(collectionRatings.userId, userId), eq(collections.slug, slug)))
      .limit(1);
    return row?.rating ?? null;
  }

  async getAggregate(slugs: string[]): Promise<Map<string, CollectionRatingAggregate>> {
    const result = new Map<string, CollectionRatingAggregate>();
    if (!slugs.length) {
      return result;
    }
    const rows = await this.db
      .select({
        slug: collections.slug,
        average: avg(collectionRatings.rating),
        count: count(collectionRatings.rating),
      })
      .from(collections)
      .innerJoin(collectionRatings, eq(collectionRatings.collectionId, collections.id))
      .where(inArray(collections.slug, slugs))
      .groupBy(collections.slug);
    for (const row of rows) {
      result.set(row.slug, {
        average: row.average != null ? Number(row.average) : null,
        count: Number(row.count),
      });
    }
    return result;
  }

  private async idBySlug(slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    return row?.id ?? null;
  }
}
