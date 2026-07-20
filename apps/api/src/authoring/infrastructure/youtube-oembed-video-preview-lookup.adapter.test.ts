import { afterEach, describe, expect, it, vi } from 'vitest';
import { YouTubeOembedVideoPreviewLookup } from './youtube-oembed-video-preview-lookup.adapter';

const adapter = new YouTubeOembedVideoPreviewLookup();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('YouTubeOembedVideoPreviewLookup', () => {
  it('returns null when the URL carries no video id (no network call)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await adapter.lookup('https://example.com')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('maps the oEmbed response to a preview', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          title: 'A performance',
          author_name: 'Some pianist',
          thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        }),
        { status: 200 },
      ),
    );
    expect(await adapter.lookup('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      videoId: 'dQw4w9WgXcQ',
      title: 'A performance',
      author: 'Some pianist',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });

  it('falls back to a deterministic thumbnail on a non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    expect(await adapter.lookup('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      videoId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });

  it('falls back to a deterministic thumbnail when the request throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    expect(await adapter.lookup('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      videoId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });
});
