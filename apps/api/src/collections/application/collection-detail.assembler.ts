import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../../catalogue/application/ports/content-repository.port';
import { toContentSummaryView } from '../../catalogue/domain/content-item';
import {
  type Collection,
  type CollectionDetailView,
  type CollectionEntryView,
  type CollectionItemMeta,
  type CollectionProgressDetailView,
  type CollectionRatingAggregate,
  type CollectionSectionView,
  toCollectionSummaryView,
} from '../domain/collection';

/**
 * Resolves a collection's ordered content slugs into `ContentSummary` entries (reusing the catalogue
 * `ContentRepository`), carrying per-item curator notes and grouping them into sections. Public views
 * drop unpublished/missing items and renumber positions; admin views keep every existing item.
 */
@Injectable()
export class CollectionDetailAssembler {
  constructor(private readonly content: ContentRepository) {}

  async assemble(
    collection: Collection,
    options: { publishedOnly: boolean; rating?: CollectionRatingAggregate },
  ): Promise<CollectionDetailView> {
    const entries = await this.resolveEntries(collection, options.publishedOnly);
    return this.toDetail(collection, entries, options.rating);
  }

  /** Like `assemble`, but flags per-item completion and computes overall progress + next-up. */
  async assembleWithProgress(
    collection: Collection,
    options: {
      publishedOnly: boolean;
      completedSlugs: string[];
      rating?: CollectionRatingAggregate;
    },
  ): Promise<CollectionProgressDetailView> {
    const completed = new Set(options.completedSlugs);
    const entries = await this.resolveEntries(collection, options.publishedOnly);
    for (const entry of entries) {
      entry.completed = completed.has(entry.content.slug);
    }
    const detail = this.toDetail(collection, entries, options.rating);
    const completedCount = entries.filter((e) => e.completed).length;
    const nextUp = entries.find((e) => !e.completed);
    return {
      ...detail,
      completedCount,
      percentComplete: entries.length ? Math.round((completedCount / entries.length) * 100) : 0,
      nextUpSlug: nextUp?.content.slug ?? null,
    };
  }

  /** Resolve slugs → summaries in flattened (section-ordered) order, dropping missing/unpublished. */
  private async resolveEntries(
    collection: Collection,
    publishedOnly: boolean,
  ): Promise<CollectionEntryView[]> {
    const metaBySlug = new Map<string, CollectionItemMeta>(
      collection.items.map((item) => [item.contentSlug, item]),
    );
    const entries: CollectionEntryView[] = [];
    for (const slug of collection.itemSlugs) {
      const item = await this.content.getBySlug(slug);
      if (!item) {
        continue;
      }
      if (publishedOnly && item.status !== 'published') {
        continue;
      }
      const meta = metaBySlug.get(slug);
      entries.push({
        position: entries.length,
        content: toContentSummaryView(item),
        sectionId: meta?.sectionId ?? undefined,
        curatorNote: meta?.curatorNote ?? undefined,
        focusSkills: meta?.focusSkills ?? undefined,
      });
    }
    return entries;
  }

  private toDetail(
    collection: Collection,
    entries: CollectionEntryView[],
    rating: CollectionRatingAggregate | undefined,
  ): CollectionDetailView {
    const summary = toCollectionSummaryView(collection, rating);
    const sections: CollectionSectionView[] = collection.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description ?? undefined,
      position: section.position,
      items: entries.filter((entry) => entry.sectionId === section.id),
    }));
    return {
      ...summary,
      // itemCount reflects what's actually shown.
      itemCount: entries.length,
      status: collection.status,
      ownerId: collection.ownerId ?? undefined,
      bodyMdx: collection.bodyMdx ?? undefined,
      outcomes: collection.outcomes ?? undefined,
      curatorBio: collection.curatorBio ?? undefined,
      items: entries,
      sections,
    };
  }
}
