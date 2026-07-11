import { Injectable } from '@nestjs/common';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import { ContentNotFoundError } from '../../../catalogue/domain/errors/content-not-found.error';
import { CatalogueReindexService } from '../../../catalogue/infrastructure/catalogue-reindex.service';
import { ContentDetailReader } from '../content-detail-reader';
import { ContentAuthoring } from '../ports/content-authoring.port';

/** Publish (`published`) / unpublish (`draft`) a content item and reindex the catalogue. */
@Injectable()
export class SetContentStatusUseCase {
  constructor(
    private readonly authoring: ContentAuthoring,
    private readonly detail: ContentDetailReader,
    private readonly reindex: CatalogueReindexService,
  ) {}

  async execute(slug: string, status: 'published' | 'draft'): Promise<ContentDetailView> {
    if (!(await this.authoring.exists(slug))) {
      throw new ContentNotFoundError(slug);
    }
    await this.authoring.setStatus(slug, status);
    await this.reindex.reindex();
    return this.detail.bySlug(slug);
  }
}
