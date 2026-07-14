import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { collectionBookmarks, collections } from '../../infrastructure/database/schema';
import { CollectionBookmarks } from '../application/ports/collection-bookmarks.port';
import { CollectionNotFoundError } from '../domain/errors/collection-not-found.error';

@Injectable()
export class DrizzleCollectionBookmarks extends CollectionBookmarks {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async add(userId: string, slug: string): Promise<void> {
    const collectionId = await this.idBySlug(slug);
    if (!collectionId) {
      throw new CollectionNotFoundError(slug);
    }
    await this.db
      .insert(collectionBookmarks)
      .values({ userId, collectionId })
      .onConflictDoNothing();
  }

  async remove(userId: string, slug: string): Promise<void> {
    const collectionId = await this.idBySlug(slug);
    if (!collectionId) {
      return;
    }
    await this.db
      .delete(collectionBookmarks)
      .where(
        and(
          eq(collectionBookmarks.userId, userId),
          eq(collectionBookmarks.collectionId, collectionId),
        ),
      );
  }

  async listSlugs(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ slug: collections.slug })
      .from(collectionBookmarks)
      .innerJoin(collections, eq(collectionBookmarks.collectionId, collections.id))
      .where(eq(collectionBookmarks.userId, userId))
      .orderBy(desc(collectionBookmarks.createdAt));
    return rows.map((r) => r.slug);
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
