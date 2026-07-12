import { en, type MessageKey, zhHans } from '@TheY2T/tmr-i18n-locales';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  isLocale,
  localizedPath,
  matchAcceptLanguage,
  preferredLocale,
  readLocaleCookie,
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
