import { describe, expect, it } from 'vitest';
import { buildLegalNav } from './nav';
import type { Flags, User } from './types';

function ctx(overrides: Partial<{ locale: 'en' | 'zh-Hans'; path: string }> = {}) {
  return {
    flags: {} as Flags,
    user: null as User,
    locale: overrides.locale ?? ('en' as const),
    path: overrides.path ?? '/',
  };
}

describe('buildLegalNav', () => {
  it('always returns the four legal destinations regardless of flags/auth', () => {
    const items = buildLegalNav(ctx());
    expect(items.map((i) => i.key)).toEqual(['about', 'privacy', 'terms', 'cookies']);
    expect(items.map((i) => i.href)).toEqual(['/about', '/privacy', '/terms', '/cookies']);
  });

  it('localizes hrefs under the active locale prefix', () => {
    const items = buildLegalNav(ctx({ locale: 'zh-Hans' }));
    expect(items.map((i) => i.href)).toEqual([
      '/zh/about',
      '/zh/privacy',
      '/zh/terms',
      '/zh/cookies',
    ]);
  });

  it('marks the current route active', () => {
    const items = buildLegalNav(ctx({ path: '/privacy' }));
    expect(items.find((i) => i.key === 'privacy')?.active).toBe(true);
    expect(items.find((i) => i.key === 'terms')?.active).toBe(false);
  });

  it('adds the FAQ link when the faq flag is on, localized', () => {
    const base = ctx();
    const en = buildLegalNav({ ...base, flags: { faq: true } as Flags });
    const faq = en.find((i) => i.key === 'faq');
    expect(faq?.href).toBe('/faq');

    const zh = buildLegalNav({ ...base, flags: { faq: true } as Flags, locale: 'zh-Hans' });
    expect(zh.find((i) => i.key === 'faq')?.href).toBe('/zh/faq');
  });
});
