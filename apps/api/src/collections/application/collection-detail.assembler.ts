import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../../catalogue/application/ports/content-repository.port';
import { applyContentOverlay, toContentSummaryView } from '../../catalogue/domain/content-item';
import { ContentTranslations } from '../../translations/application/ports/content-translations.port';
import {
  applyCollectionOverlay,
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
  constructor(
    private readonly content: ContentRepository,
    private readonly translations: ContentTranslations,
  ) {}

  /** Overlay the collection's own fields for `locale` (its items are localized in `resolveEntries`). */
  private async localizeCollection(collection: Collection, locale?: string): Promise<Collection> {
    if (!locale) {
      return collection;
    }
    return applyCollectionOverlay(
      collection,
      await this.translations.overlay('collection', collection.id, locale),
    );
  }

  async assemble(
    collection: Collection,
    options: { publishedOnly: boolean; rating?: CollectionRatingAggregate; locale?: string },
  ): Promise<CollectionDetailView> {
    const localized = await this.localizeCollection(collection, options.locale);
    const entries = await this.resolveEntries(localized, options.publishedOnly, options.locale);
    return this.toDetail(localized, entries, options.rating);
  }

  /** Like `assemble`, but flags per-item completion and computes overall progress + next-up. */
  async assembleWithProgress(
    collection: Collection,
    options: {
      publishedOnly: boolean;
      completedSlugs: string[];
      rating?: CollectionRatingAggregate;
      locale?: string;
    },
  ): Promise<CollectionProgressDetailView> {
    const localized = await this.localizeCollection(collection, options.locale);
    const completed = new Set(options.completedSlugs);
    const entries = await this.resolveEntries(localized, options.publishedOnly, options.locale);
    for (const entry of entries) {
      entry.completed = completed.has(entry.content.slug);
    }
    const detail = this.toDetail(localized, entries, options.rating);
    const completedCount = entries.filter((e) => e.completed).length;
    const nextUp = entries.find((e) => !e.completed);
    return {
      ...detail,
      completedCount,
      percentComplete: entries.length ? Math.round((completedCount / entries.length) * 100) : 0,
      nextUpSlug: nextUp?.content.slug ?? null,
    };
  }

  /** Resolve slugs → summaries in flattened (section-ordered) order, dropping missing/unpublished.
   *  When `locale` is set, item titles/summaries are overlaid with published content translations. */
  private async resolveEntries(
    collection: Collection,
    publishedOnly: boolean,
    locale?: string,
  ): Promise<CollectionEntryView[]> {
    const metaBySlug = new Map<string, CollectionItemMeta>(
      collection.items.map((item) => [item.contentSlug, item]),
    );
    const resolved: { item: Awaited<ReturnType<ContentRepository['getBySlug']>>; slug: string }[] =
      [];
    for (const slug of collection.itemSlugs) {
      const item = await this.content.getBySlug(slug);
      if (!item || (publishedOnly && item.status !== 'published')) {
        continue;
      }
      resolved.push({ item, slug });
    }

    const overlays = locale
      ? await this.translations.overlayMany(
          'content',
          resolved.map((r) => r.item?.id).filter((id): id is string => Boolean(id)),
          locale,
        )
      : new Map<string, Record<string, string>>();

    return resolved.map(({ item, slug }, position) => {
      const localized =
        item && locale ? applyContentOverlay(item, overlays.get(item.id) ?? {}) : item;
      const meta = metaBySlug.get(slug);
      return {
        position,
        // biome-ignore lint/style/noNonNullAssertion: filtered to defined items above
        content: toContentSummaryView(localized!),
        sectionId: meta?.sectionId ?? undefined,
        curatorNote: meta?.curatorNote ?? undefined,
        focusSkills: meta?.focusSkills ?? undefined,
      };
    });
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
