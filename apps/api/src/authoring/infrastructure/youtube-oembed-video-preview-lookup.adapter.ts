import { parseYouTubeId, youTubeThumbnailUrl } from '@TheY2T/tmr-content-serde';
import { Injectable, Logger } from '@nestjs/common';
import type { VideoPreview } from '../application/ports/video-preview-lookup.port';
import { VideoPreviewLookup } from '../application/ports/video-preview-lookup.port';

/** YouTube's keyless oEmbed endpoint — returns title/author/thumbnail as JSON, no API key. */
const OEMBED_ENDPOINT = 'https://www.youtube.com/oembed';
const TIMEOUT_MS = 4000;

interface OembedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

/**
 * Resolves a YouTube video's preview via the public oEmbed endpoint. Parsing the id is authoritative;
 * the network call only enriches title/author/thumbnail and degrades to a deterministic thumbnail when
 * the request fails, times out, or the video is private/removed.
 */
@Injectable()
export class YouTubeOembedVideoPreviewLookup extends VideoPreviewLookup {
  private readonly logger = new Logger(YouTubeOembedVideoPreviewLookup.name);

  async lookup(url: string): Promise<VideoPreview | null> {
    const videoId = parseYouTubeId(url);
    if (!videoId) return null;

    const fallback: VideoPreview = { videoId, thumbnailUrl: youTubeThumbnailUrl(videoId) };
    const canonical = `https://www.youtube.com/watch?v=${videoId}`;
    const endpoint = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(canonical)}&format=json`;

    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) return fallback;
      const data = (await res.json()) as OembedResponse;
      return {
        videoId,
        title: data.title,
        author: data.author_name,
        thumbnailUrl: data.thumbnail_url ?? fallback.thumbnailUrl,
      };
    } catch (error) {
      this.logger.warn(`oEmbed lookup failed for ${videoId}: ${(error as Error).message}`);
      return fallback;
    }
  }
}
