import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { slugToLabel } from '../../catalogue/domain/content-item';
import { ContentNotFoundError } from '../../catalogue/domain/errors/content-not-found.error';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import {
  contentGenres,
  contentInstruments,
  contentItems,
  contentSkillTopics,
  contentTags,
  genres,
  instruments,
  mediaAssets,
  skillTopics,
  tags,
} from '../../infrastructure/database/schema';
import {
  type ContentAdminRow,
  ContentAuthoring,
  type ContentWriteData,
  type MediaRowInput,
} from '../application/ports/content-authoring.port';

@Injectable()
export class DrizzleContentAuthoring extends ContentAuthoring {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async listAll(): Promise<ContentAdminRow[]> {
    const rows = await this.db.select().from(contentItems).orderBy(desc(contentItems.updatedAt));
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      type: r.type,
      status: r.status,
      visibility: r.visibility,
      difficulty: r.difficulty ?? undefined,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async exists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    return Boolean(row);
  }

  async create(data: ContentWriteData): Promise<void> {
    const [row] = await this.db
      .insert(contentItems)
      .values({
        slug: data.slug,
        title: data.title,
        summary: data.summary ?? null,
        bodyMdx: data.bodyMdx ?? null,
        type: data.type,
        visibility: data.visibility ?? 'public',
        status: 'draft',
        difficulty: data.difficulty ?? null,
        source: data.source ?? null,
        attribution: data.attribution ?? null,
        license: data.license ?? null,
      })
      .returning({ id: contentItems.id });
    if (row) {
      await this.attachTaxonomy(row.id, data);
    }
  }

  async update(slug: string, data: ContentWriteData): Promise<void> {
    const [row] = await this.db
      .update(contentItems)
      .set({
        title: data.title,
        summary: data.summary ?? null,
        bodyMdx: data.bodyMdx ?? null,
        type: data.type,
        visibility: data.visibility ?? 'public',
        difficulty: data.difficulty ?? null,
        source: data.source ?? null,
        attribution: data.attribution ?? null,
        license: data.license ?? null,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.slug, slug))
      .returning({ id: contentItems.id });
    if (!row) {
      throw new ContentNotFoundError(slug);
    }
    await this.clearTaxonomy(row.id);
    await this.attachTaxonomy(row.id, data);
  }

  async setStatus(slug: string, status: string): Promise<void> {
    await this.db
      .update(contentItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(contentItems.slug, slug));
  }

  async delete(slug: string): Promise<void> {
    // FKs cascade to joins + media rows; the object-storage files are left (harmless orphans).
    await this.db.delete(contentItems).where(eq(contentItems.slug, slug));
  }

  async addMedia(slug: string, media: MediaRowInput): Promise<string> {
    const [content] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    if (!content) {
      throw new ContentNotFoundError(slug);
    }
    const [row] = await this.db
      .insert(mediaAssets)
      .values({
        contentId: content.id,
        kind: media.kind,
        storageKey: media.storageKey,
        filename: media.filename,
        mime: media.mime,
        bytes: 0,
        license: media.license ?? null,
        attribution: media.attribution ?? null,
      })
      .returning({ id: mediaAssets.id });
    if (!row) {
      throw new ContentNotFoundError(slug);
    }
    return row.id;
  }

  private async attachTaxonomy(contentId: string, data: ContentWriteData): Promise<void> {
    await this.attachDimension(contentId, genres, contentGenres, 'genreId', data.genres);
    await this.attachDimension(
      contentId,
      instruments,
      contentInstruments,
      'instrumentId',
      data.instruments,
    );
    await this.attachDimension(
      contentId,
      skillTopics,
      contentSkillTopics,
      'skillTopicId',
      data.topics,
    );
    await this.attachDimension(contentId, tags, contentTags, 'tagId', data.tags);
  }

  private async clearTaxonomy(contentId: string): Promise<void> {
    await Promise.all([
      this.db.delete(contentGenres).where(eq(contentGenres.contentId, contentId)),
      this.db.delete(contentInstruments).where(eq(contentInstruments.contentId, contentId)),
      this.db.delete(contentSkillTopics).where(eq(contentSkillTopics.contentId, contentId)),
      this.db.delete(contentTags).where(eq(contentTags.contentId, contentId)),
    ]);
  }

  /** Upsert each term (auto-creating unknown slugs) and link it to the content item. */
  private async attachDimension(
    contentId: string,
    // biome-ignore lint/suspicious/noExplicitAny: genres/instruments/skill_topics/tags share {id,slug,name}.
    termTable: any,
    // biome-ignore lint/suspicious/noExplicitAny: join tables share {content_id, <fk>}.
    joinTable: any,
    fkColumn: string,
    slugs: string[],
  ): Promise<void> {
    for (const slug of slugs) {
      if (!slug) {
        continue;
      }
      await this.db
        .insert(termTable)
        .values({ slug, name: slugToLabel(slug) })
        .onConflictDoNothing();
      const [term] = await this.db
        .select({ id: termTable.id })
        .from(termTable)
        .where(eq(termTable.slug, slug))
        .limit(1);
      if (!term) {
        continue;
      }
      await this.db
        .insert(joinTable)
        .values({ contentId, [fkColumn]: term.id })
        .onConflictDoNothing();
    }
  }
}
