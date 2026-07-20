import { parseYouTubeId, youTubeThumbnailUrl } from '@TheY2T/tmr-content-serde';
import { Injectable } from '@nestjs/common';
import { InvalidVideoUrlError } from '../../domain/errors/invalid-video-url.error';
import type { VideoPreview } from '../ports/video-preview-lookup.port';
import { VideoPreviewLookup } from '../ports/video-preview-lookup.port';

/** Resolve a video URL to its preview for the block editor's live embed inspector. */
@Injectable()
export class GetVideoPreviewUseCase {
  constructor(private readonly preview: VideoPreviewLookup) {}

  async execute(url: string): Promise<VideoPreview> {
    const videoId = parseYouTubeId(url);
    if (!videoId) throw new InvalidVideoUrlError(url);
    return (
      (await this.preview.lookup(url)) ?? { videoId, thumbnailUrl: youTubeThumbnailUrl(videoId) }
    );
  }
}
