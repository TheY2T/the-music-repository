import { Injectable } from '@nestjs/common';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import { ContentNotFoundError } from '../../../catalogue/domain/errors/content-not-found.error';
import { CatalogueReindexService } from '../../../catalogue/infrastructure/catalogue-reindex.service';
import { ContentDetailReader } from '../content-detail-reader';
import { ContentAuthoring } from '../ports/content-authoring.port';
import { ContentRevisions } from '../ports/content-revisions.port';

/** Move a content item through its lifecycle (`draft`/`review`/`published`) and reindex the catalogue. */
@Injectable()
export class SetContentStatusUseCase {
  constructor(
    private readonly authoring: ContentAuthoring,
    private readonly detail: ContentDetailReader,
    private readonly reindex: CatalogueReindexService,
    private readonly revisions: ContentRevisions,
  ) {}

  async execute(
    slug: string,
    status: 'published' | 'draft' | 'review',
    authorId: string | null = null,
  ): Promise<ContentDetailView> {
    if (!(await this.authoring.exists(slug))) {
      throw new ContentNotFoundError(slug);
    }
    await this.authoring.setStatus(slug, status);
    // Snapshot the published state so the version history has a restorable checkpoint per publish.
    if (status === 'published') {
      await this.revisions.snapshot(slug, authorId);
    }
    await this.reindex.reindex();
    return this.detail.bySlug(slug);
  }
}
