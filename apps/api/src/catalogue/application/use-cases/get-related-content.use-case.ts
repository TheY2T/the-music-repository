import { Injectable } from '@nestjs/common';
import { type ContentSummaryView, toContentSummaryView } from '../../domain/content-item';
import { ContentRepository } from '../ports/content-repository.port';

const RELATED_LIMIT = 6;

@Injectable()
export class GetRelatedContentUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(slug: string): Promise<ContentSummaryView[]> {
    const related = await this.repository.findRelated(slug, RELATED_LIMIT);
    return related.map(toContentSummaryView);
  }
}
