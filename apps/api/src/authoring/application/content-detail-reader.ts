import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../../catalogue/application/ports/content-repository.port';
import { MediaLibrary } from '../../catalogue/application/ports/media-library.port';
import {
  type ContentDetailView,
  type MediaView,
  toContentDetailView,
} from '../../catalogue/domain/content-item';
import { ContentNotFoundError } from '../../catalogue/domain/errors/content-not-found.error';

/**
 * Reads a content item of ANY status and assembles the `ContentDetail` response (with presigned media)
 * — the admin equivalent of the public read path, reused by every authoring use-case that returns detail.
 */
@Injectable()
export class ContentDetailReader {
  constructor(
    private readonly repository: ContentRepository,
    private readonly media: MediaLibrary,
  ) {}

  async bySlug(slug: string): Promise<ContentDetailView> {
    const item = await this.repository.getBySlug(slug);
    if (!item) {
      throw new ContentNotFoundError(slug);
    }
    const media: MediaView[] = await Promise.all(
      item.media.map(async (asset) => ({
        id: asset.id,
        kind: asset.kind,
        filename: asset.filename,
        mime: asset.mime,
        license: asset.license ?? undefined,
        attribution: asset.attribution ?? undefined,
        url: await this.media.presignGetUrl(asset.storageKey),
      })),
    );
    return toContentDetailView(item, media);
  }
}
