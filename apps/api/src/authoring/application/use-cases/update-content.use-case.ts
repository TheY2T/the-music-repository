import { Injectable } from '@nestjs/common';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import { ContentNotFoundError } from '../../../catalogue/domain/errors/content-not-found.error';
import { CatalogueReindexService } from '../../../catalogue/infrastructure/catalogue-reindex.service';
import { ContentDetailReader } from '../content-detail-reader';
import { ContentAuthoring, type ContentWriteData } from '../ports/content-authoring.port';
import { VideoEmbedEnricher } from '../video-embed-enricher';

@Injectable()
export class UpdateContentUseCase {
  constructor(
    private readonly authoring: ContentAuthoring,
    private readonly detail: ContentDetailReader,
    private readonly reindex: CatalogueReindexService,
    private readonly videoEnricher: VideoEmbedEnricher,
  ) {}

  async execute(slug: string, data: ContentWriteData): Promise<ContentDetailView> {
    if (!(await this.authoring.exists(slug))) {
      throw new ContentNotFoundError(slug);
    }
    await this.authoring.update(slug, await this.videoEnricher.enrich(data));
    // Fields/taxonomy may have changed; keep the search index in sync if it's published.
    await this.reindex.reindex();
    return this.detail.bySlug(slug);
  }
}
