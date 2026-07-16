import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ContentRepository } from '../../../catalogue/application/ports/content-repository.port';
import { MediaLibrary } from '../../../catalogue/application/ports/media-library.port';
import { ContentNotFoundError } from '../../../catalogue/domain/errors/content-not-found.error';
import { UnsafeMediaTypeError } from '../../domain/errors/unsafe-media-type.error';
import { ContentAuthoring } from '../ports/content-authoring.port';

/** MIME types rejected for safety (SVG can embed scripts). */
const UNSAFE_MIME = /svg/i;

export interface MediaUploadRequest {
  filename: string;
  mime: string;
  kind: string;
  license?: string | null;
  attribution?: string | null;
}

export interface MediaUploadTicket {
  mediaId: string;
  storageKey: string;
  uploadUrl: string;
}

/**
 * Reserves a media row + a presigned PUT URL. The browser uploads the bytes directly to storage,
 * keeping large files out of the API process.
 */
@Injectable()
export class RequestMediaUploadUseCase {
  constructor(
    private readonly repository: ContentRepository,
    private readonly authoring: ContentAuthoring,
    private readonly media: MediaLibrary,
  ) {}

  async execute(slug: string, request: MediaUploadRequest): Promise<MediaUploadTicket> {
    if (UNSAFE_MIME.test(request.mime) || /\.svg$/i.test(request.filename)) {
      throw new UnsafeMediaTypeError(request.mime);
    }
    const item = await this.repository.getBySlug(slug);
    if (!item) {
      throw new ContentNotFoundError(slug);
    }

    const safeName = request.filename.replace(/[^\w.-]+/g, '_');
    const storageKey = `content/${slug}/${randomUUID()}-${safeName}`;
    const uploadUrl = await this.media.presignPutUrl(storageKey, request.mime);
    const mediaId = await this.authoring.addMedia(slug, {
      kind: request.kind,
      filename: request.filename,
      mime: request.mime,
      storageKey,
      license: request.license ?? null,
      attribution: request.attribution ?? null,
    });

    return { mediaId, storageKey, uploadUrl };
  }
}
