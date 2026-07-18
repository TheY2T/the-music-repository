import { en, type MessageKey, zhHans } from '@TheY2T/tmr-i18n-locales';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  getCatalogueVersion,
  hasCatalogue,
  hydrateCatalogueFromDom,
  isLocale,
  loadCatalogue,
  localizedPath,
  matchAcceptLanguage,
  preferredLocale,
  readLocaleCookie,
  type SerializedCatalogue,
  splitLocalePath,
  t,
} from './index';

describe('t()', () => {
  it('resolves a real catalogue key to its English string', () => {
    const [key, value] = Object.entries(en)[0] as [MessageKey, string];
    expect(t('en', key)).toBe(value);
  });

  it('falls back to the key itself when the message is unknown (never blank)', () => {
    expect(t('en', 'totally.unknown.key' as MessageKey)).toBe('totally.unknown.key');
  });

  it('falls back to English for keys missing in zh-Hans', () => {
    const missing = Object.keys(en).find((k) => !(k in zhHans)) as MessageKey | undefined;
    if (missing) {
      expect(t('zh-Hans', missing)).toBe(en[missing as keyof typeof en]);
    }
  });

  it('interpolates {placeholders} from params', () => {
    // An unknown key falls back to the key string; interpolation then runs on it, exercising both.
    expect(t('en', 'Hello {name}!' as MessageKey, { name: 'Ada' })).toBe('Hello Ada!');
  });

  it('leaves unmatched placeholders intact', () => {
    expect(t('en', '{missing}' as MessageKey, { other: 'x' })).toBe('{missing}');
  });
});

describe('locale routing helpers', () => {
  it('localizedPath leaves the default locale un-prefixed and prefixes others', () => {
    expect(localizedPath('en', '/catalogue')).toBe('/catalogue');
    expect(localizedPath('zh-Hans', '/catalogue')).toBe('/zh/catalogue');
    expect(localizedPath('zh-Hans', '/')).toBe('/zh');
  });

  it('splitLocalePath round-trips prefixed and canonical paths', () => {
    expect(splitLocalePath('/zh/catalogue')).toEqual({ locale: 'zh-Hans', path: '/catalogue' });
    expect(splitLocalePath('/zh')).toEqual({ locale: 'zh-Hans', path: '/' });
    expect(splitLocalePath('/catalogue')).toEqual({ locale: 'en', path: '/catalogue' });
  });

  it('matchAcceptLanguage picks the best supported locale', () => {
    expect(matchAcceptLanguage('zh-CN,en;q=0.9')).toBe('zh-Hans');
    expect(matchAcceptLanguage('en-US')).toBe('en');
    expect(matchAcceptLanguage('fr')).toBeNull();
  });

  it('readLocaleCookie reads only supported locales', () => {
    expect(readLocaleCookie('theme=dark; locale=zh-Hans')).toBe('zh-Hans');
    expect(readLocaleCookie('locale=xx')).toBeNull();
    expect(readLocaleCookie(null)).toBeNull();
  });

  it('preferredLocale prefers cookie > accept-language > default', () => {
    expect(preferredLocale({ cookie: 'locale=zh-Hans', acceptLanguage: 'en' })).toBe('zh-Hans');
    expect(preferredLocale({ acceptLanguage: 'zh' })).toBe('zh-Hans');
    expect(preferredLocale({})).toBe(DEFAULT_LOCALE);
  });

  it('isLocale is a correct type guard', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zh-Hans')).toBe(true);
    expect(isLocale('xx')).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

// These mutate the module-level REGISTRY, so they run last (the fallback tests above assume it is empty).
describe('runtime catalogue (DB-sourced)', () => {
  const sampleKey = Object.keys(en)[0] as MessageKey;

  it('loadCatalogue makes t() resolve from the runtime registry, overriding the bundled fallback', () => {
    expect(hasCatalogue('en')).toBe(false); // nothing loaded yet → bundled fallback in use
    loadCatalogue('en', { [sampleKey]: 'Runtime override', 'db.only.key': 'From the DB' }, 'v1');
    expect(hasCatalogue('en')).toBe(true);
    expect(getCatalogueVersion()).toBe('v1');
    expect(t('en', sampleKey)).toBe('Runtime override');
    // A key that exists only in the DB (not in the compile-time catalogue) still resolves.
    expect(t('en', 'db.only.key' as MessageKey)).toBe('From the DB');
  });

  it('falls through registry → default-locale registry → bundled fallback → key', () => {
    loadCatalogue('en', { [sampleKey]: 'EN runtime' }, 'v2');
    loadCatalogue('zh-Hans', {}, 'v2'); // loaded but empty → misses fall through to the en registry
    expect(t('zh-Hans', sampleKey)).toBe('EN runtime'); // default-locale registry
    // A key absent from every registry falls to the bundled fallback, then to the key itself.
    const zhOnlyMissing = 'never.in.any.catalogue' as MessageKey;
    expect(t('zh-Hans', zhOnlyMissing)).toBe(zhOnlyMissing);
  });

  it('loadCatalogue swaps the whole reference (no in-place merge)', () => {
    loadCatalogue('en', { a: '1', b: '2' } as Record<string, string>, 'v3');
    loadCatalogue('en', { a: '9' } as Record<string, string>, 'v4');
    expect(t('en', 'a' as MessageKey)).toBe('9');
    expect(t('en', 'b' as MessageKey)).toBe('b'); // gone — not merged from the previous load
    expect(getCatalogueVersion()).toBe('v4');
  });

  describe('hydrateCatalogueFromDom', () => {
    afterEach(() => {
      (globalThis as { document?: unknown }).document = undefined;
    });

    function stubDom(textContent: string | null): void {
      (globalThis as { document?: unknown }).document = {
        getElementById: (id: string) =>
          id === 'i18n-catalogue' && textContent !== null ? { textContent } : null,
      };
    }

    it('loads the embedded blob (and its fallback) into the registry', () => {
      const blob: SerializedCatalogue = {
        version: 'h1',
        locale: 'zh-Hans',
        messages: { greeting: '你好' },
        fallback: { greeting: 'Hello' },
      };
      stubDom(JSON.stringify(blob));
      hydrateCatalogueFromDom();
      expect(getCatalogueVersion()).toBe('h1');
      expect(t('zh-Hans', 'greeting' as MessageKey)).toBe('你好');
      expect(t('en', 'greeting' as MessageKey)).toBe('Hello'); // fallback loaded into the en registry
    });

    it('is a safe no-op when the blob is missing or malformed', () => {
      const before = getCatalogueVersion();
      stubDom(null);
      expect(() => hydrateCatalogueFromDom()).not.toThrow();
      stubDom('{ not json');
      expect(() => hydrateCatalogueFromDom()).not.toThrow();
      expect(getCatalogueVersion()).toBe(before); // unchanged
    });
  });
});
