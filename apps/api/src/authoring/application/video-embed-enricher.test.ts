import { describe, expect, it, vi } from 'vitest';
import type { ContentEmbed } from '../../catalogue/domain/content-item';
import type { ContentWriteData } from './ports/content-authoring.port';
import type { VideoPreviewLookup } from './ports/video-preview-lookup.port';
import { VideoEmbedEnricher } from './video-embed-enricher';

function build(lookupResult: unknown = null) {
  const preview = { lookup: vi.fn().mockResolvedValue(lookupResult) };
  const enricher = new VideoEmbedEnricher(preview as unknown as VideoPreviewLookup);
  return { enricher, preview };
}

function data(embeds: ContentEmbed[]): ContentWriteData {
  return {
    slug: 's',
    title: 'T',
    type: 'lesson',
    genres: [],
    instruments: [],
    topics: [],
    tags: [],
    embeds,
  };
}

describe('VideoEmbedEnricher', () => {
  it('caches the id + deterministic thumbnail and fetches the title when none was authored', async () => {
    const { enricher, preview } = build({
      videoId: 'dQw4w9WgXcQ',
      title: 'Real title',
      author: 'A channel',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
    const result = await enricher.enrich(
      data([{ tool: 'youtube', videoUrl: 'https://youtu.be/dQw4w9WgXcQ' }]),
    );
    const embed = result.embeds?.[0];
    expect(embed?.videoId).toBe('dQw4w9WgXcQ');
    expect(embed?.title).toBe('Real title');
    expect(embed?.videoAuthor).toBe('A channel');
    expect(preview.lookup).toHaveBeenCalledOnce();
  });

  it('skips the network lookup when the author already supplied a title', async () => {
    const { enricher, preview } = build();
    const result = await enricher.enrich(
      data([{ tool: 'youtube', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', title: 'Mine' }]),
    );
    expect(preview.lookup).not.toHaveBeenCalled();
    expect(result.embeds?.[0]?.videoId).toBe('dQw4w9WgXcQ');
    expect(result.embeds?.[0]?.thumbnailUrl).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
  });

  it('keeps the deterministic thumbnail when the lookup fails', async () => {
    const { enricher } = build(null);
    const result = await enricher.enrich(
      data([{ tool: 'youtube', videoUrl: 'https://youtu.be/dQw4w9WgXcQ' }]),
    );
    expect(result.embeds?.[0]?.thumbnailUrl).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
  });

  it('leaves non-youtube embeds and unparseable URLs untouched', async () => {
    const { enricher, preview } = build();
    const result = await enricher.enrich(
      data([
        { tool: 'score', tex: 'x' },
        { tool: 'youtube', videoUrl: 'not-a-url' },
      ]),
    );
    expect(result.embeds?.[0]).toEqual({ tool: 'score', tex: 'x' });
    expect(result.embeds?.[1]).toEqual({ tool: 'youtube', videoUrl: 'not-a-url' });
    expect(preview.lookup).not.toHaveBeenCalled();
  });
});
