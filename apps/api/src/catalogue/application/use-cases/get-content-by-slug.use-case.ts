import { Injectable } from '@nestjs/common';
import {
  type ContentDetailView,
  type MediaView,
  tierRank,
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

  /** `viewerRank` = the viewer's highest entitlement tier rank (Infinity for staff / gating off).
   * A premium item below the viewer's rank returns a locked preview (metadata only). */
  async execute(slug: string, viewerRank: number): Promise<ContentDetailView> {
    const item = await this.repository.getBySlug(slug);
    if (!item || item.status !== 'published') {
      throw new ContentNotFoundError(slug);
    }

    // Premium content the viewer's tier can't unlock: metadata only, no body/media (never presigned).
    if (item.visibility === 'premium' && viewerRank < tierRank(item.tier)) {
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
        sourceUrl: asset.sourceUrl ?? undefined,
        url: await this.media.presignGetUrl(asset.storageKey),
      })),
    );

    return toContentDetailView(item, media);
  }
}
