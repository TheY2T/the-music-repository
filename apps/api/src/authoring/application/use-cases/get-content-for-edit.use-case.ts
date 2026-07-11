import { Injectable } from '@nestjs/common';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import { ContentDetailReader } from '../content-detail-reader';

@Injectable()
export class GetContentForEditUseCase {
  constructor(private readonly detail: ContentDetailReader) {}

  /** Any-status detail for the editor (throws ContentNotFoundError → 404 if missing). */
  execute(slug: string): Promise<ContentDetailView> {
    return this.detail.bySlug(slug);
  }
}
