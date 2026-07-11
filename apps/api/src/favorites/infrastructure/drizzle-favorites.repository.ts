import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { ContentNotFoundError } from '../../catalogue/domain/errors/content-not-found.error';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { contentItems, favorites } from '../../infrastructure/database/schema';
import { FavoritesRepository } from '../application/ports/favorites-repository.port';

@Injectable()
export class DrizzleFavoritesRepository extends FavoritesRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async add(userId: string, slug: string): Promise<void> {
    const contentId = await this.contentIdBySlug(slug);
    if (!contentId) {
      throw new ContentNotFoundError(slug);
    }
    await this.db.insert(favorites).values({ userId, contentId }).onConflictDoNothing();
  }

  async remove(userId: string, slug: string): Promise<void> {
    const contentId = await this.contentIdBySlug(slug);
    if (!contentId) {
      return; // nothing to remove
    }
    await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.contentId, contentId)));
  }

  async listSlugs(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ slug: contentItems.slug })
      .from(favorites)
      .innerJoin(contentItems, eq(favorites.contentId, contentItems.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    return rows.map((r) => r.slug);
  }

  private async contentIdBySlug(slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    return row?.id ?? null;
  }
}
