import { describe, expect, it } from 'vitest';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildSeo,
  jsonLdScript,
  musicCompositionJsonLd,
  pageTitle,
} from './seo';

const SITE = new URL('https://music.example.com');

describe('pageTitle', () => {
  it('brand-suffixes with an em dash', () => {
    expect(pageTitle('Für Elise', 'The Music Repository')).toBe('Für Elise — The Music Repository');
  });
});

describe('buildSeo canonical + hreflang', () => {
  it('canonicalizes to the same locale (never cross-locale)', () => {
    const en = buildSeo({
      locale: 'en',
      site: SITE,
      path: '/catalogue/fur-elise',
      title: 'x',
      i18nEnabled: true,
    });
    const zh = buildSeo({
      locale: 'zh-Hans',
      site: SITE,
      path: '/catalogue/fur-elise',
      title: 'x',
      i18nEnabled: true,
    });
    expect(en.canonical).toBe('https://music.example.com/catalogue/fur-elise');
    // The zh page self-canonicalizes to its /zh URL — NOT back to the English page.
    expect(zh.canonical).toBe('https://music.example.com/zh/catalogue/fur-elise');
  });

  it('emits reciprocal hreflang alternates incl. x-default when i18n is on', () => {
    const { alternates } = buildSeo({
      locale: 'zh-Hans',
      site: SITE,
      path: '/catalogue/x',
      title: 'x',
      i18nEnabled: true,
    });
    expect(alternates).toEqual([
      { hreflang: 'en', href: 'https://music.example.com/catalogue/x' },
      { hreflang: 'zh-Hans', href: 'https://music.example.com/zh/catalogue/x' },
      { hreflang: 'x-default', href: 'https://music.example.com/catalogue/x' },
    ]);
  });

  it('emits no alternates when i18n is off', () => {
    expect(buildSeo({ locale: 'en', site: SITE, path: '/', title: 'x' }).alternates).toEqual([]);
  });
});

describe('buildSeo OG + robots + image', () => {
  it('maps OG locale to underscore form and lists alternates', () => {
    const zh = buildSeo({ locale: 'zh-Hans', site: SITE, path: '/', title: 'x' });
    expect(zh.ogLocale).toBe('zh_CN');
    expect(zh.ogLocaleAlternates).toEqual(['en_US']);
  });

  it('falls back to the default OG image, absolutized', () => {
    expect(buildSeo({ locale: 'en', site: SITE, path: '/', title: 'x' }).ogImage).toBe(
      'https://music.example.com/og-default.png',
    );
  });

  it('passes an already-absolute cover-art URL through unchanged', () => {
    const meta = buildSeo({
      locale: 'en',
      site: SITE,
      path: '/',
      title: 'x',
      image: 'https://cdn.example.com/cover.jpg',
    });
    expect(meta.ogImage).toBe('https://cdn.example.com/cover.jpg');
  });

  it('sets noindex robots only when requested', () => {
    expect(buildSeo({ locale: 'en', site: SITE, path: '/', title: 'x' }).robots).toBeUndefined();
    expect(
      buildSeo({ locale: 'en', site: SITE, path: '/', title: 'x', noindex: true }).robots,
    ).toBe('noindex,nofollow');
  });
});

describe('JSON-LD builders', () => {
  it('breadcrumb positions items in order', () => {
    const ld = breadcrumbJsonLd([
      { name: 'Catalogue', url: 'https://x/catalogue' },
      { name: 'Für Elise', url: 'https://x/catalogue/fur-elise' },
    ]) as { itemListElement: { position: number; name: string }[] };
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].name).toBe('Für Elise');
  });

  it('article carries author + publisher', () => {
    const ld = articleJsonLd({
      headline: 'Für Elise',
      url: 'https://x/catalogue/fur-elise',
      authorName: 'Michael Hewett',
    }) as { '@type': string; author: { name: string } };
    expect(ld['@type']).toBe('Article');
    expect(ld.author.name).toBe('Michael Hewett');
  });

  it('music composition captures composer + key + language', () => {
    const ld = musicCompositionJsonLd({
      name: 'Für Elise',
      composer: 'Beethoven',
      musicalKey: 'A minor',
      locale: 'en',
    }) as { composer: { name: string }; musicalKey: string; inLanguage: string };
    expect(ld.composer.name).toBe('Beethoven');
    expect(ld.musicalKey).toBe('A minor');
    expect(ld.inLanguage).toBe('en');
  });

  it('jsonLdScript escapes < so a value cannot break out of the script block', () => {
    expect(jsonLdScript({ name: '</script><x>' })).not.toContain('</script>');
    expect(jsonLdScript({ name: '</script>' })).toContain('\\u003c');
  });
});
