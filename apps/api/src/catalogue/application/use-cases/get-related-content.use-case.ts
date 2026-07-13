import { Injectable } from '@nestjs/common';
import { type ContentSummaryView, toContentSummaryView } from '../../domain/content-item';
import { ContentRepository } from '../ports/content-repository.port';

const RELATED_LIMIT = 6;

@Injectable()
export class GetRelatedContentUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(slug: string): Promise<ContentSummaryView[]> {
    // Prefer the item's curated "if you like this" slugs; fall back to algorithmic overlap.
    const item = await this.repository.getBySlug(slug);
    const curated = item?.details?.related ?? [];
    if (curated.length > 0) {
      const items = await this.repository.findManyBySlugs(curated);
      if (items.length > 0) {
        return items.map(toContentSummaryView);
      }
    }
    const related = await this.repository.findRelated(slug, RELATED_LIMIT);
    return related.map(toContentSummaryView);
  }
}
