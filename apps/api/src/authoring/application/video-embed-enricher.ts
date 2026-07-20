import { parseYouTubeId, youTubeThumbnailUrl } from '@TheY2T/tmr-content-serde';
import { Injectable } from '@nestjs/common';
import type { ContentEmbed } from '../../catalogue/domain/content-item';
import type { ContentWriteData } from './ports/content-authoring.port';
import { VideoPreviewLookup } from './ports/video-preview-lookup.port';

/**
 * Fills in cached preview metadata for `youtube` embeds before they are persisted, so the stored embed
 * carries a crawler-visible title + thumbnail and the read side needs no runtime network call. The
 * video id + deterministic thumbnail are always set from the URL; the title/author are fetched from
 * oEmbed only when the author hasn't already supplied a title (the block editor pre-fills it via the
 * preview endpoint), keeping saves fast and idempotent.
 */
@Injectable()
export class VideoEmbedEnricher {
  constructor(private readonly preview: VideoPreviewLookup) {}

  async enrich(data: ContentWriteData): Promise<ContentWriteData> {
    if (!data.embeds?.length) return data;
    const embeds = await Promise.all(data.embeds.map((embed) => this.enrichEmbed(embed)));
    return { ...data, embeds };
  }

  private async enrichEmbed(embed: ContentEmbed): Promise<ContentEmbed> {
    if (embed.tool !== 'youtube') return embed;
    const videoId = parseYouTubeId(embed.videoUrl ?? embed.videoId);
    if (!videoId) return embed;

    const enriched: ContentEmbed = {
      ...embed,
      videoId,
      thumbnailUrl: embed.thumbnailUrl ?? youTubeThumbnailUrl(videoId),
    };
    if (enriched.title) return enriched;

    const preview = await this.preview.lookup(embed.videoUrl ?? videoId);
    if (!preview) return enriched;
    return {
      ...enriched,
      title: preview.title ?? enriched.title,
      videoAuthor: preview.author ?? enriched.videoAuthor,
      thumbnailUrl: preview.thumbnailUrl ?? enriched.thumbnailUrl,
    };
  }
}
