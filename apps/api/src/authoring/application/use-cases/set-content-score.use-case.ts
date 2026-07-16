import { Injectable } from '@nestjs/common';
import { MediaLibrary } from '../../../catalogue/application/ports/media-library.port';
import type { ContentDetailView } from '../../../catalogue/domain/content-item';
import { ContentNotFoundError } from '../../../catalogue/domain/errors/content-not-found.error';
import { ContentDetailReader } from '../content-detail-reader';
import { ContentAuthoring } from '../ports/content-authoring.port';

/**
 * Store a standalone score item's alphaTex as its single `alphatex` media asset (ADR 0030): the text is
 * written to object storage under a stable per-slug key (overwriting on re-save) and the media row is
 * replaced, so the detail page's `ScorePlayer` renders it. No search reindex (media doesn't affect it).
 */
@Injectable()
export class SetContentScoreUseCase {
  constructor(
    private readonly authoring: ContentAuthoring,
    private readonly media: MediaLibrary,
    private readonly detail: ContentDetailReader,
  ) {}

  async execute(slug: string, tex: string): Promise<ContentDetailView> {
    if (!(await this.authoring.exists(slug))) {
      throw new ContentNotFoundError(slug);
    }
    const storageKey = `scores/${slug}.alphatex`;
    await this.media.putObject(storageKey, new TextEncoder().encode(tex), 'text/plain');
    await this.authoring.replaceAlphaTex(slug, storageKey, `${slug}.alphatex`);
    return this.detail.bySlug(slug);
  }
}
