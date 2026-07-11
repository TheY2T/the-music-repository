import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { collectionItems, collections, contentItems } from '../../infrastructure/database/schema';
import { CollectionRepository } from '../application/ports/collection-repository.port';
import type { Collection, CollectionWriteData } from '../domain/collection';

type CollectionRow = typeof collections.$inferSelect;

@Injectable()
export class DrizzleCollectionRepository extends CollectionRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async getBySlug(slug: string): Promise<Collection | null> {
    const [row] = await this.db
      .select()
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    return row ? this.hydrate(row) : null;
  }

  async findAllPublished(): Promise<Collection[]> {
    const rows = await this.db
      .select()
      .from(collections)
      .where(eq(collections.status, 'published'))
      .orderBy(asc(collections.title));
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async listAll(): Promise<Collection[]> {
    const rows = await this.db.select().from(collections).orderBy(desc(collections.updatedAt));
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async exists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  async create(data: CollectionWriteData): Promise<void> {
    await this.db.insert(collections).values({
      slug: data.slug,
      title: data.title,
      summary: data.summary ?? null,
      kind: data.kind,
      visibility: data.visibility ?? 'public',
      status: 'draft',
    });
  }

  async update(slug: string, data: CollectionWriteData): Promise<void> {
    await this.db
      .update(collections)
      .set({
        title: data.title,
        summary: data.summary ?? null,
        kind: data.kind,
        visibility: data.visibility ?? 'public',
        updatedAt: new Date(),
      })
      .where(eq(collections.slug, slug));
  }

  async setStatus(slug: string, status: string): Promise<void> {
    await this.db
      .update(collections)
      .set({ status, updatedAt: new Date() })
      .where(eq(collections.slug, slug));
  }

  async delete(slug: string): Promise<void> {
    await this.db.delete(collections).where(eq(collections.slug, slug));
  }

  async setItems(slug: string, contentSlugs: string[]): Promise<void> {
    const [collection] = await this.db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    if (!collection) {
      return;
    }
    await this.db.delete(collectionItems).where(eq(collectionItems.collectionId, collection.id));

    // Resolve slugs → ids, preserving the requested order and dropping unknowns/dupes.
    const wanted = contentSlugs.filter((s, i) => s && contentSlugs.indexOf(s) === i);
    if (!wanted.length) {
      return;
    }
    const rows = await this.db
      .select({ id: contentItems.id, slug: contentItems.slug })
      .from(contentItems)
      .where(inArray(contentItems.slug, wanted));
    const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));

    const values = wanted
      .map((s, position) => ({ slug: s, position }))
      .filter((entry) => idBySlug.has(entry.slug))
      .map((entry, position) => ({
        collectionId: collection.id,
        contentId: idBySlug.get(entry.slug) as string,
        position,
      }));
    if (values.length) {
      await this.db.insert(collectionItems).values(values);
    }
  }

  private async hydrate(row: CollectionRow): Promise<Collection> {
    const items = await this.db
      .select({ slug: contentItems.slug })
      .from(collectionItems)
      .innerJoin(contentItems, eq(collectionItems.contentId, contentItems.id))
      .where(eq(collectionItems.collectionId, row.id))
      .orderBy(asc(collectionItems.position));
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      kind: row.kind,
      visibility: row.visibility,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      itemSlugs: items.map((i) => i.slug),
    };
  }
}
