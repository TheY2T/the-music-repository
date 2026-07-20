import { describe, expect, it, vi } from 'vitest';
import { InvalidVideoUrlError } from '../../domain/errors/invalid-video-url.error';
import type { VideoPreviewLookup } from '../ports/video-preview-lookup.port';
import { GetVideoPreviewUseCase } from './get-video-preview.use-case';

function build(lookupResult: unknown = null) {
  const preview = { lookup: vi.fn().mockResolvedValue(lookupResult) };
  return new GetVideoPreviewUseCase(preview as unknown as VideoPreviewLookup);
}

describe('GetVideoPreviewUseCase', () => {
  it('rejects a URL with no recognizable video id', async () => {
    await expect(build().execute('https://example.com')).rejects.toBeInstanceOf(
      InvalidVideoUrlError,
    );
  });

  it('returns the resolved preview', async () => {
    const useCase = build({ videoId: 'dQw4w9WgXcQ', title: 'Hi', thumbnailUrl: 'x' });
    await expect(useCase.execute('https://youtu.be/dQw4w9WgXcQ')).resolves.toMatchObject({
      videoId: 'dQw4w9WgXcQ',
      title: 'Hi',
    });
  });

  it('falls back to a deterministic thumbnail when the lookup yields nothing', async () => {
    const useCase = build(null);
    await expect(useCase.execute('https://youtu.be/dQw4w9WgXcQ')).resolves.toEqual({
      videoId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });
});
