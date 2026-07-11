import { Injectable } from '@nestjs/common';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import { ContentSlugConflictError } from '../../domain/errors/content-slug-conflict.error';
import { ContentDetailReader } from '../content-detail-reader';
import { ContentAuthoring, type ContentWriteData } from '../ports/content-authoring.port';

@Injectable()
export class CreateContentUseCase {
  constructor(
    private readonly authoring: ContentAuthoring,
    private readonly detail: ContentDetailReader,
  ) {}

  async execute(data: ContentWriteData): Promise<ContentDetailView> {
    if (await this.authoring.exists(data.slug)) {
      throw new ContentSlugConflictError(data.slug);
    }
    await this.authoring.create(data);
    // Starts as draft — no reindex needed until it's published.
    return this.detail.bySlug(data.slug);
  }
}
