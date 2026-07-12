import { Injectable } from '@nestjs/common';
import {
  type ContentDetailView,
  type MediaView,
  toContentDetailView,
  toLockedContentDetailView,
} from '../../domain/content-item';
import { ContentNotFoundError } from '../../domain/errors/content-not-found.error';
import { ContentRepository } from '../ports/content-repository.port';
import { MediaLibrary } from '../ports/media-library.port';

@Injectable()
export class GetContentBySlugUseCase {
  constructor(
    private readonly repository: ContentRepository,
    private readonly media: MediaLibrary,
  ) {}

  /** `entitled` = the viewer may access premium content; otherwise premium returns a locked preview. */
  async execute(slug: string, entitled: boolean): Promise<ContentDetailView> {
    const item = await this.repository.getBySlug(slug);
    if (!item || item.status !== 'published') {
      throw new ContentNotFoundError(slug);
    }

    // Premium content for a non-entitled viewer: metadata only, no body/media (never presigned).
    if (item.visibility === 'premium' && !entitled) {
      return toLockedContentDetailView(item);
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
