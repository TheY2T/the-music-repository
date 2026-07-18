import { Injectable } from '@nestjs/common';
import { ContentTranslations } from '../../../translations/application/ports/content-translations.port';
import {
  applyContentOverlay,
  type ContentItem,
  type ContentSummaryView,
  toContentSummaryView,
} from '../../domain/content-item';
import { ContentRepository } from '../ports/content-repository.port';

const RELATED_LIMIT = 6;

@Injectable()
export class GetRelatedContentUseCase {
  constructor(
    private readonly repository: ContentRepository,
    private readonly translations: ContentTranslations,
  ) {}

  async execute(slug: string, locale?: string): Promise<ContentSummaryView[]> {
    // Prefer the item's curated "if you like this" slugs; fall back to algorithmic overlap.
    const item = await this.repository.getBySlug(slug);
    const curated = item?.details?.related ?? [];
    if (curated.length > 0) {
      const items = await this.repository.findManyBySlugs(curated);
      if (items.length > 0) {
        return this.localize(items, locale);
      }
    }
    const related = await this.repository.findRelated(slug, RELATED_LIMIT);
    return this.localize(related, locale);
  }

  /** Overlay published translations onto each item (one batched query) before projecting to summaries. */
  private async localize(items: ContentItem[], locale?: string): Promise<ContentSummaryView[]> {
    if (!locale || items.length === 0) {
      return items.map(toContentSummaryView);
    }
    const overlays = await this.translations.overlayMany(
      'content',
      items.map((item) => item.id),
      locale,
    );
    return items.map((item) =>
      toContentSummaryView(applyContentOverlay(item, overlays.get(item.id) ?? {})),
    );
  }
}
