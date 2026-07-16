import { Injectable } from '@nestjs/common';
import { ContentNotFoundError } from '../../../catalogue/domain/errors/content-not-found.error';
import { ContentAuthoring } from '../ports/content-authoring.port';
import { type ContentRevisionRow, ContentRevisions } from '../ports/content-revisions.port';

/** List a content item's saved revisions (newest first). */
@Injectable()
export class ListContentRevisionsUseCase {
  constructor(
    private readonly authoring: ContentAuthoring,
    private readonly revisions: ContentRevisions,
  ) {}

  async execute(slug: string): Promise<{ items: ContentRevisionRow[] }> {
    if (!(await this.authoring.exists(slug))) {
      throw new ContentNotFoundError(slug);
    }
    return { items: await this.revisions.list(slug) };
  }
}
