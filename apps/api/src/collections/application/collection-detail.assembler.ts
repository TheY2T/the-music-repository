import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../../catalogue/application/ports/content-repository.port';
import { toContentSummaryView } from '../../catalogue/domain/content-item';
import {
  type Collection,
  type CollectionDetailView,
  type CollectionEntryView,
  toCollectionSummaryView,
} from '../domain/collection';

/**
 * Resolves a collection's ordered content slugs into `ContentSummary` entries (reusing the catalogue
 * `ContentRepository`). Public views drop unpublished/missing items and renumber positions; admin
 * views keep every existing item so editors see the full list.
 */
@Injectable()
export class CollectionDetailAssembler {
  constructor(private readonly content: ContentRepository) {}

  async assemble(
    collection: Collection,
    options: { publishedOnly: boolean },
  ): Promise<CollectionDetailView> {
    const items: CollectionEntryView[] = [];
    for (const slug of collection.itemSlugs) {
      const item = await this.content.getBySlug(slug);
      if (!item) {
        continue;
      }
      if (options.publishedOnly && item.status !== 'published') {
        continue;
      }
      items.push({ position: items.length, content: toContentSummaryView(item) });
    }
    return {
      ...toCollectionSummaryView(collection),
      // itemCount reflects what's actually shown.
      itemCount: items.length,
      status: collection.status,
      items,
    };
  }
}
