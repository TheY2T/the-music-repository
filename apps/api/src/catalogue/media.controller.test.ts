import { NotFoundException, StreamableFile } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { MediaLibrary, MediaObject } from './application/ports/media-library.port';
import { MediaController } from './media.controller';

const OBJECT: MediaObject = {
  data: new TextEncoder().encode('bytes'),
  mime: 'image/png',
  bytes: 5,
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
};
const ETAG = `W/"5-${OBJECT.updatedAt.getTime()}"`;
const LAST_MODIFIED = OBJECT.updatedAt.toUTCString();

function makeController(object: MediaObject | null = OBJECT) {
  const media = { getObject: vi.fn().mockResolvedValue(object) } as unknown as MediaLibrary;
  return { controller: new MediaController(media), media };
}

function fakeRes() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 200,
    headers,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return this;
    },
  };
}

describe('MediaController', () => {
  it('sets caching headers and streams the bytes on a fresh request', async () => {
    const { controller } = makeController();
    const res = fakeRes();
    const result = await controller.download({ headers: {} }, res as never, 'content/a/x.png');

    expect(result).toBeInstanceOf(StreamableFile);
    expect(res.headers['Cache-Control']).toBe('public, max-age=3600, stale-while-revalidate=86400');
    expect(res.headers.ETag).toBe(ETAG);
    expect(res.headers['Last-Modified']).toBe(LAST_MODIFIED);
    expect(res.statusCode).toBe(200);
  });

  it('returns 304 with no body when the ETag matches', async () => {
    const { controller } = makeController();
    const res = fakeRes();
    const result = await controller.download(
      { headers: { 'if-none-match': ETAG } },
      res as never,
      'content/a/x.png',
    );

    expect(result).toBeUndefined();
    expect(res.statusCode).toBe(304);
  });

  it('returns 304 when If-Modified-Since matches Last-Modified', async () => {
    const { controller } = makeController();
    const res = fakeRes();
    const result = await controller.download(
      { headers: { 'if-modified-since': LAST_MODIFIED } },
      res as never,
      'content/a/x.png',
    );

    expect(result).toBeUndefined();
    expect(res.statusCode).toBe(304);
  });

  it('404s an unknown or missing key', async () => {
    const { controller } = makeController(null);
    const res = fakeRes();
    await expect(
      controller.download({ headers: {} }, res as never, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      controller.download({ headers: {} }, res as never, undefined),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
