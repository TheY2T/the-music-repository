import { describe, expect, it, vi } from 'vitest';
import type {
  GetLocaleCatalogueUseCase,
  GetLocalesUseCase,
  GetLocaleVersionsUseCase,
} from './application/ui-message.use-cases';
import { I18nController } from './i18n.controller';

const CATALOGUE = { locale: 'en', version: 'v-7', messages: {} };
const ETAG = '"v-7"';
const CACHE_CONTROL = 'public, max-age=0, s-maxage=30, stale-while-revalidate=60';

function makeController() {
  const getCatalogue = {
    execute: vi.fn().mockResolvedValue(CATALOGUE),
  } as unknown as GetLocaleCatalogueUseCase;
  const controller = new I18nController(
    {} as GetLocaleVersionsUseCase,
    getCatalogue,
    {} as GetLocalesUseCase,
  );
  return { controller, getCatalogue };
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

describe('I18nController catalogue caching', () => {
  it('serves the catalogue with a versioned ETag and a short shared-cache window', async () => {
    const { controller } = makeController();
    const res = fakeRes();
    const result = await controller.catalogue('en', { headers: {} }, res as never);

    expect(result).toBe(CATALOGUE);
    expect(res.headers.ETag).toBe(ETAG);
    expect(res.headers['Cache-Control']).toBe(CACHE_CONTROL);
    expect(res.statusCode).toBe(200);
  });

  it('returns 304 with no body when the ETag matches', async () => {
    const { controller } = makeController();
    const res = fakeRes();
    const result = await controller.catalogue(
      'en',
      { headers: { 'if-none-match': ETAG } },
      res as never,
    );

    expect(result).toBeUndefined();
    expect(res.statusCode).toBe(304);
  });
});
