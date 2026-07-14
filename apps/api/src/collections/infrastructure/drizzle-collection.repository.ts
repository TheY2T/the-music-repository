import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  collectionItems,
  collectionSections,
  collections,
  contentItems,
} from '../../infrastructure/database/schema';
import { CollectionRepository } from '../application/ports/collection-repository.port';
import type {
  Collection,
  CollectionItemMeta,
  CollectionItemWriteData,
  CollectionSection,
  CollectionSectionWriteData,
  CollectionWriteData,
} from '../domain/collection';

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

  async findPublishedContaining(contentSlug: string): Promise<Collection[]> {
    const idRows = await this.db
      .select({ id: collectionItems.collectionId })
      .from(collectionItems)
      .innerJoin(contentItems, eq(collectionItems.contentId, contentItems.id))
      .where(eq(contentItems.slug, contentSlug));
    const ids = [...new Set(idRows.map((r) => r.id))];
    if (!ids.length) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(collections)
      .where(
        and(
          inArray(collections.id, ids),
          eq(collections.status, 'published'),
          ne(collections.visibility, 'private'),
        ),
      )
      .orderBy(asc(collections.title));
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async listAll(): Promise<Collection[]> {
    const rows = await this.db.select().from(collections).orderBy(desc(collections.updatedAt));
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async listByOwner(userId: string): Promise<Collection[]> {
    const rows = await this.db
      .select()
      .from(collections)
      .where(eq(collections.ownerId, userId))
      .orderBy(desc(collections.updatedAt));
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
      status: 'draft',
      ...this.writeValues(data),
    });
  }

  async update(slug: string, data: CollectionWriteData): Promise<void> {
    await this.db
      .update(collections)
      .set({ ...this.writeValues(data), updatedAt: new Date() })
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

  async incrementPopularity(slug: string): Promise<void> {
    await this.db
      .update(collections)
      .set({ popularity: sql`${collections.popularity} + 1` })
      .where(eq(collections.slug, slug));
  }

  async setSections(slug: string, sections: CollectionSectionWriteData[]): Promise<void> {
    const id = await this.collectionIdBySlug(slug);
    if (!id) {
      return;
    }
    // Replace: dropping a section sets its items' section_id to null (FK on delete set null).
    await this.db.delete(collectionSections).where(eq(collectionSections.collectionId, id));
    if (!sections.length) {
      return;
    }
    await this.db.insert(collectionSections).values(
      sections.map((section, position) => ({
        collectionId: id,
        title: section.title,
        description: section.description ?? null,
        position,
      })),
    );
  }

  async setItems(slug: string, items: CollectionItemWriteData[]): Promise<void> {
    const id = await this.collectionIdBySlug(slug);
    if (!id) {
      return;
    }
    await this.db.delete(collectionItems).where(eq(collectionItems.collectionId, id));

    // Dedupe by slug preserving first occurrence; drop empties.
    const seen = new Set<string>();
    const wanted = items.filter((item) => {
      const s = item.contentSlug;
      if (!s || seen.has(s)) {
        return false;
      }
      seen.add(s);
      return true;
    });
    if (!wanted.length) {
      return;
    }

    // Resolve content slugs → ids (dropping unknowns) and section indices → section ids.
    const contentRows = await this.db
      .select({ id: contentItems.id, slug: contentItems.slug })
      .from(contentItems)
      .where(inArray(contentItems.slug, [...seen]));
    const contentIdBySlug = new Map(contentRows.map((r) => [r.slug, r.id]));

    const sectionRows = await this.db
      .select({ id: collectionSections.id })
      .from(collectionSections)
      .where(eq(collectionSections.collectionId, id))
      .orderBy(asc(collectionSections.position));
    const sectionIdByIndex = sectionRows.map((r) => r.id);

    const values = wanted
      .filter((item) => contentIdBySlug.has(item.contentSlug))
      .map((item, position) => ({
        collectionId: id,
        contentId: contentIdBySlug.get(item.contentSlug) as string,
        sectionId: item.sectionIndex != null ? (sectionIdByIndex[item.sectionIndex] ?? null) : null,
        position,
        curatorNote: item.curatorNote ?? null,
        focusSkills: item.focusSkills ?? null,
      }));
    if (values.length) {
      await this.db.insert(collectionItems).values(values);
    }
  }

  private async collectionIdBySlug(slug: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    return row?.id ?? null;
  }

  /** Map write data → column values (create/update share this). */
  private writeValues(data: CollectionWriteData) {
    return {
      title: data.title,
      summary: data.summary ?? null,
      bodyMdx: data.bodyMdx ?? null,
      kind: data.kind,
      visibility: data.visibility ?? 'public',
      curationType: data.curationType ?? 'editorial',
      ownerId: data.ownerId ?? null,
      heroImageKey: data.heroImageKey ?? null,
      accent: data.accent ?? null,
      featured: data.featured ?? false,
      difficultyMin: data.difficultyMin ?? null,
      difficultyMax: data.difficultyMax ?? null,
      estMinutes: data.estMinutes ?? null,
      curatorName: data.curatorName ?? null,
      curatorBio: data.curatorBio ?? null,
      outcomes: data.outcomes ?? null,
      facets: data.facets ?? null,
      tags: data.tags ?? null,
    };
  }

  private async hydrate(row: CollectionRow): Promise<Collection> {
    const [sectionRows, itemRows] = await Promise.all([
      this.db
        .select()
        .from(collectionSections)
        .where(eq(collectionSections.collectionId, row.id))
        .orderBy(asc(collectionSections.position)),
      this.db
        .select({
          slug: contentItems.slug,
          sectionId: collectionItems.sectionId,
          curatorNote: collectionItems.curatorNote,
          focusSkills: collectionItems.focusSkills,
          position: collectionItems.position,
        })
        .from(collectionItems)
        .innerJoin(contentItems, eq(collectionItems.contentId, contentItems.id))
        .where(eq(collectionItems.collectionId, row.id))
        .orderBy(asc(collectionItems.position)),
    ]);

    const itemSlugs = itemRows.map((i) => i.slug);
    const items: CollectionItemMeta[] = itemRows.map((i) => ({
      contentSlug: i.slug,
      sectionId: i.sectionId,
      curatorNote: i.curatorNote,
      focusSkills: i.focusSkills,
    }));
    const sections: CollectionSection[] = sectionRows.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      position: s.position,
      itemSlugs: itemRows.filter((i) => i.sectionId === s.id).map((i) => i.slug),
    }));

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      bodyMdx: row.bodyMdx,
      kind: row.kind,
      visibility: row.visibility,
      status: row.status,
      curationType: row.curationType,
      ownerId: row.ownerId,
      heroImageKey: row.heroImageKey,
      accent: row.accent,
      featured: row.featured,
      difficultyMin: row.difficultyMin,
      difficultyMax: row.difficultyMax,
      estMinutes: row.estMinutes,
      curatorName: row.curatorName,
      curatorBio: row.curatorBio,
      outcomes: row.outcomes ?? null,
      facets: row.facets ?? null,
      tags: row.tags ?? null,
      popularity: row.popularity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      itemSlugs,
      sections,
      items,
    };
  }
}
