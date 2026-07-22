import { describe, expect, it, vi } from 'vitest';
import type { FeatureFlagCatalogue } from './application/ports/feature-flag-catalogue.port';
import { FeatureFlagController } from './feature-flags.controller';

const SNAPSHOT = { environment: 'dev', version: 'v-42', flags: {} };
const ETAG = '"v-42"';
const CACHE_CONTROL = 'public, max-age=0, s-maxage=30, stale-while-revalidate=60';

function makeController() {
  const catalogue = {
    snapshot: vi.fn().mockResolvedValue(SNAPSHOT),
    environments: vi.fn().mockResolvedValue(['dev', 'prod']),
  } as unknown as FeatureFlagCatalogue;
  return { controller: new FeatureFlagController(catalogue), catalogue };
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

describe('FeatureFlagController snapshot caching', () => {
  it('serves the snapshot with a versioned ETag and a short shared-cache window', async () => {
    const { controller } = makeController();
    const res = fakeRes();
    const result = await controller.snapshot('dev', { headers: {} }, res as never);

    expect(result).toBe(SNAPSHOT);
    expect(res.headers.ETag).toBe(ETAG);
    expect(res.headers['Cache-Control']).toBe(CACHE_CONTROL);
    expect(res.statusCode).toBe(200);
  });

  it('returns 304 with no body when the ETag matches', async () => {
    const { controller } = makeController();
    const res = fakeRes();
    const result = await controller.snapshot(
      'dev',
      { headers: { 'if-none-match': ETAG } },
      res as never,
    );

    expect(result).toBeUndefined();
    expect(res.statusCode).toBe(304);
    // The ETag is still advertised on the 304 so the client keeps revalidating against it.
    expect(res.headers.ETag).toBe(ETAG);
  });
});
