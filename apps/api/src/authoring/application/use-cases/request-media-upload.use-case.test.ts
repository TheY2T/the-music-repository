import { describe, expect, it, vi } from 'vitest';
import type { ContentRepository } from '../../../catalogue/application/ports/content-repository.port';
import type { MediaLibrary } from '../../../catalogue/application/ports/media-library.port';
import { UnsafeMediaTypeError } from '../../domain/errors/unsafe-media-type.error';
import type { ContentAuthoring } from '../ports/content-authoring.port';
import { RequestMediaUploadUseCase } from './request-media-upload.use-case';

function build() {
  const repository = { getBySlug: vi.fn().mockResolvedValue({ id: 'c1', slug: 'x' }) };
  const authoring = { addMedia: vi.fn().mockResolvedValue('m1') };
  const media = { presignPutUrl: vi.fn().mockResolvedValue('https://put') };
  const useCase = new RequestMediaUploadUseCase(
    repository as unknown as ContentRepository,
    authoring as unknown as ContentAuthoring,
    media as unknown as MediaLibrary,
  );
  return { useCase, media };
}

describe('RequestMediaUploadUseCase', () => {
  it('rejects SVG uploads (script-carrying vector) before touching storage', async () => {
    const { useCase, media } = build();
    await expect(
      useCase.execute('x', { filename: 'logo.svg', mime: 'image/svg+xml', kind: 'image' }),
    ).rejects.toBeInstanceOf(UnsafeMediaTypeError);
    expect(media.presignPutUrl).not.toHaveBeenCalled();
  });

  it('allows a raster image', async () => {
    const { useCase } = build();
    const ticket = await useCase.execute('x', {
      filename: 'cover.png',
      mime: 'image/png',
      kind: 'image',
    });
    expect(ticket.uploadUrl).toBe('https://put');
  });
});
