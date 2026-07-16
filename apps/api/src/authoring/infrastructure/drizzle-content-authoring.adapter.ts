import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { type ContentDetails, slugToLabel } from '../../catalogue/domain/content-item';
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

const FACT_KEYS = [
  'key',
  'era',
  'form',
  'timeSignature',
  'composer',
  'composerDates',
  'composedYear',
] as const;

/** True when the payload carries any part of `details` (facts, related, or embeds). */
function hasDetails(data: ContentWriteData): boolean {
  return data.details !== undefined || data.related !== undefined || data.embeds !== undefined;
}

/** Drop an empty object to null so the column clears rather than storing `{}`. */
function nonEmpty(details: ContentDetails): ContentDetails | null {
  return Object.keys(details).length > 0 ? details : null;
}

/**
 * Build the `details` JSONB for a **create** from the write payload's facts + `related` + `embeds` (the
 * top-level `embeds`/`related` write fields mirror the read view; `details` is where they live).
 */
function mergeDetails(data: ContentWriteData): ContentDetails | null {
  const merged: ContentDetails = { ...(data.details ?? {}) };
  if (data.related !== undefined) {
    merged.related = data.related;
  }
  if (data.embeds !== undefined) {
    merged.embeds = data.embeds;
  }
  return nonEmpty(merged);
}

/**
 * Overlay the provided `details` parts onto the **existing** stored `details` for an update. Only the
 * parts the payload carries are changed — so a client that edits embeds (the block editor) but has no
 * facts/`related` UI preserves them, rather than clobbering fields the read view (which hides `related`)
 * never surfaced. An empty `related`/`embeds` array explicitly clears that part.
 */
function overlayDetails(
  existing: ContentDetails | null,
  data: ContentWriteData,
): ContentDetails | null {
  const merged: ContentDetails = { ...(existing ?? {}) };
  if (data.details) {
    for (const key of FACT_KEYS) {
      const value = data.details[key];
      if (value !== undefined) {
        merged[key] = value;
      }
    }
  }
  if (data.related !== undefined) {
    if (data.related.length) {
      merged.related = data.related;
    } else {
      delete merged.related;
    }
  }
  if (data.embeds !== undefined) {
    if (data.embeds.length) {
      merged.embeds = data.embeds;
    } else {
      delete merged.embeds;
    }
  }
  return nonEmpty(merged);
}

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
        tier: data.tier ?? null,
        status: 'draft',
        difficulty: data.difficulty ?? null,
        source: data.source ?? null,
        attribution: data.attribution ?? null,
        license: data.license ?? null,
        details: mergeDetails(data),
        bodyDoc: data.bodyDoc ?? null,
      })
      .returning({ id: contentItems.id });
    if (row) {
      await this.attachTaxonomy(row.id, data);
    }
  }

  async update(slug: string, data: ContentWriteData): Promise<void> {
    // `details`/`tier`/`bodyDoc` are only written when the payload carries them, so a client that omits
    // them (e.g. a partial edit) preserves the existing values rather than clearing them.
    const set: Partial<typeof contentItems.$inferInsert> = {
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
    };
    if (data.tier !== undefined) {
      set.tier = data.tier;
    }
    if (data.bodyDoc !== undefined) {
      set.bodyDoc = data.bodyDoc ?? null;
    }
    if (hasDetails(data)) {
      const [existing] = await this.db
        .select({ details: contentItems.details })
        .from(contentItems)
        .where(eq(contentItems.slug, slug))
        .limit(1);
      set.details = overlayDetails(existing?.details ?? null, data);
    }
    const [row] = await this.db
      .update(contentItems)
      .set(set)
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
