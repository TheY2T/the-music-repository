import { Injectable } from '@nestjs/common';
import type { ContentDetailView, ContentItem, MediaView } from '../../domain/content-item';
import { ContentNotFoundError } from '../../domain/errors/content-not-found.error';
import { ContentRepository } from '../ports/content-repository.port';
import { MediaLibrary } from '../ports/media-library.port';

@Injectable()
export class GetContentBySlugUseCase {
  constructor(
    private readonly repository: ContentRepository,
    private readonly media: MediaLibrary,
  ) {}

  async execute(slug: string): Promise<ContentDetailView> {
    const item = await this.repository.getBySlug(slug);
    if (!item || item.status !== 'published') {
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

    return toDetailView(item, media);
  }
}

function toDetailView(item: ContentItem, media: MediaView[]): ContentDetailView {
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary ?? undefined,
    type: item.type,
    difficulty: item.difficulty ?? undefined,
    visibility: item.visibility,
    genres: item.genres,
    instruments: item.instruments,
    topics: item.topics,
    bodyMdx: item.bodyMdx ?? undefined,
    source: item.source ?? undefined,
    attribution: item.attribution ?? undefined,
    license: item.license ?? undefined,
    tags: item.tags,
    media,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
