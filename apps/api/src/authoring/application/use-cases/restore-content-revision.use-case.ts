import { Injectable } from '@nestjs/common';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import { CatalogueReindexService } from '../../../catalogue/infrastructure/catalogue-reindex.service';
import { ContentDetailReader } from '../content-detail-reader';
import { ContentRevisions } from '../ports/content-revisions.port';

/** Restore a revision's snapshot onto the content item, reindex, and return the updated detail. */
@Injectable()
export class RestoreContentRevisionUseCase {
  constructor(
    private readonly revisions: ContentRevisions,
    private readonly detail: ContentDetailReader,
    private readonly reindex: CatalogueReindexService,
  ) {}

  async execute(slug: string, revisionId: string): Promise<ContentDetailView> {
    await this.revisions.restore(slug, revisionId);
    await this.reindex.reindex();
    return this.detail.bySlug(slug);
  }
}
