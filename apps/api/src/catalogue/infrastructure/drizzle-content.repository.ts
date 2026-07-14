import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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
import { ContentRepository } from '../application/ports/content-repository.port';
import type { ContentItem, MediaAssetMeta, TaxonomyRef } from '../domain/content-item';

type ContentRow = typeof contentItems.$inferSelect;

@Injectable()
export class DrizzleContentRepository extends ContentRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async getBySlug(slug: string): Promise<ContentItem | null> {
    const [row] = await this.db
      .select()
      .from(contentItems)
      .where(eq(contentItems.slug, slug))
      .limit(1);
    if (!row) {
      return null;
    }
    return this.hydrate(row);
  }

  async findAllPublished(): Promise<ContentItem[]> {
    const rows = await this.db
      .select()
      .from(contentItems)
      .where(eq(contentItems.status, 'published'));
    // N+1 is fine at seed scale; batch-load later if the catalogue grows large.
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async findRelated(slug: string, limit: number): Promise<ContentItem[]> {
    const source = await this.getBySlug(slug);
    if (!source || source.status !== 'published') {
      return [];
    }
    // Overlap = count of shared taxonomy slugs (genre/instrument/topic). At seed scale, scoring in
    // memory over the published set is simpler and cheaper than a multi-join SQL ranking query.
    const sourceTaxonomy = new Set(
      [...source.genres, ...source.instruments, ...source.topics].map((ref) => ref.slug),
    );
    const published = await this.findAllPublished();
    return published
      .filter((item) => item.slug !== slug)
      .map((item) => ({
        item,
        overlap: [...item.genres, ...item.instruments, ...item.topics].filter((ref) =>
          sourceTaxonomy.has(ref.slug),
        ).length,
      }))
      .filter((scored) => scored.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || a.item.title.localeCompare(b.item.title))
      .slice(0, limit)
      .map((scored) => scored.item);
  }

  async findManyBySlugs(slugs: string[]): Promise<ContentItem[]> {
    // Curated related lists are short, so per-slug hydration (reusing getBySlug) is fine. Preserve
    // the requested order; skip missing or unpublished slugs.
    const items = await Promise.all(slugs.map((slug) => this.getBySlug(slug)));
    return items.filter(
      (item): item is ContentItem => item !== null && item.status === 'published',
    );
  }

  private async hydrate(row: ContentRow): Promise<ContentItem> {
    const [genreRefs, instrumentRefs, topicRefs, tagRefs, media] = await Promise.all([
      this.taxonomy(contentGenres, contentGenres.genreId, genres, row.id),
      this.taxonomy(contentInstruments, contentInstruments.instrumentId, instruments, row.id),
      this.taxonomy(contentSkillTopics, contentSkillTopics.skillTopicId, skillTopics, row.id),
      this.taxonomy(contentTags, contentTags.tagId, tags, row.id),
      this.mediaFor(row.id),
    ]);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      bodyMdx: row.bodyMdx,
      type: row.type,
      visibility: row.visibility,
      tier: row.tier,
      status: row.status,
      difficulty: row.difficulty,
      source: row.source,
      attribution: row.attribution,
      license: row.license,
      details: row.details ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      genres: genreRefs,
      instruments: instrumentRefs,
      topics: topicRefs,
      tags: tagRefs,
      media,
    };
  }

  // biome-ignore lint/suspicious/noExplicitAny: join/dimension tables share a shape but differ by exact type.
  private async taxonomy(
    join: any,
    // biome-ignore lint/suspicious/noExplicitAny: drizzle column type varies per dimension.
    joinFk: any,
    // biome-ignore lint/suspicious/noExplicitAny: genres/instruments/skill_topics/tags share {id,slug,name}.
    dimension: any,
    contentId: string,
  ): Promise<TaxonomyRef[]> {
    const rows = await this.db
      .select({ slug: dimension.slug, name: dimension.name })
      .from(join)
      .innerJoin(dimension, eq(joinFk, dimension.id))
      .where(eq(join.contentId, contentId));
    return rows as TaxonomyRef[];
  }

  private async mediaFor(contentId: string): Promise<MediaAssetMeta[]> {
    const rows = await this.db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.contentId, contentId));
    return rows.map((m) => ({
      id: m.id,
      kind: m.kind,
      storageKey: m.storageKey,
      filename: m.filename,
      mime: m.mime,
      license: m.license,
      attribution: m.attribution,
      sourceUrl: m.sourceUrl,
    }));
  }
}
