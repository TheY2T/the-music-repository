/**
 * SEO metadata assembly for the site's single HTML shell. `BaseLayout.astro` owns `<head>`, so the
 * canonical/Open Graph/robots/JSON-LD plumbing lives here as pure functions: pages hand `BaseLayout` a
 * title (+ optional description/image/type/noindex/jsonLd) and this module normalizes it into the exact
 * tags to emit. Absolute URLs come from Astro's configured `site` (`PUBLIC_SITE_URL` in production).
 */
import { htmlLang, LOCALES, type Locale, localizedPath } from '@TheY2T/tmr-i18n';
import { business } from './business';

/** Default social share image (1200×630), served from `public/`. Used when a page has no cover art. */
export const DEFAULT_OG_IMAGE = '/og-default.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Open Graph locales use underscore `language_TERRITORY` (not hreflang's hyphenated BCP-47) and carry no
// script subtag, so Simplified Chinese is `zh_CN` here but `zh-Hans` in the `<html lang>`/hreflang.
const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  'zh-Hans': 'zh_CN',
};

export interface SeoInput {
  locale: Locale;
  /** Astro's configured site origin (`Astro.site`). */
  site: URL | undefined;
  /** Locale-stripped canonical path (from `splitLocalePath`), e.g. `/catalogue/fur-elise`. */
  path: string;
  /** Full `<title>` text (already brand-suffixed via {@link pageTitle}). */
  title: string;
  description?: string;
  /** Cover-art URL (absolute or root-relative). Falls back to {@link DEFAULT_OG_IMAGE}. */
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  /** Whether locale alternates apply (mirrors the `platform.i18n` flag). */
  i18nEnabled?: boolean;
}

export interface HreflangAlternate {
  hreflang: string;
  href: string;
}

export interface SeoMeta {
  title: string;
  description?: string;
  canonical?: string;
  /** `noindex,nofollow` for private surfaces; omitted (index,follow default) otherwise. */
  robots?: string;
  ogType: string;
  ogUrl?: string;
  ogImage?: string;
  ogLocale: string;
  ogLocaleAlternates: string[];
  ogSiteName: string;
  twitterCard: 'summary_large_image';
  /** hreflang link set (per locale + `x-default`); empty when i18n is disabled. */
  alternates: HreflangAlternate[];
}

/** Resolve a path or absolute URL against the site origin; passes through already-absolute URLs. */
function absolute(site: URL | undefined, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return site ? new URL(pathOrUrl, site).href : pathOrUrl;
}

/** Absolute canonical URL for a locale's view of a path (self-referential, never cross-locale). */
function localizedUrl(site: URL | undefined, locale: Locale, path: string): string {
  return absolute(site, localizedPath(locale, path));
}

/** `"Section — Site Name"` — the consistent title shape across every page. */
export function pageTitle(pageTitle: string, siteName: string): string {
  return `${pageTitle} — ${siteName}`;
}

/** Normalize page inputs into the concrete head tags `BaseLayout` emits. */
export function buildSeo(input: SeoInput): SeoMeta {
  const { locale, site, path, title, description, image, type = 'website', noindex } = input;
  const canonical = localizedUrl(site, locale, path);
  const alternates: HreflangAlternate[] = input.i18nEnabled
    ? [
        ...LOCALES.map((l) => ({ hreflang: htmlLang(l), href: localizedUrl(site, l, path) })),
        { hreflang: 'x-default', href: localizedUrl(site, 'en', path) },
      ]
    : [];

  return {
    title,
    description,
    canonical,
    robots: noindex ? 'noindex,nofollow' : undefined,
    ogType: type,
    ogUrl: canonical,
    ogImage: absolute(site, image ?? DEFAULT_OG_IMAGE),
    ogLocale: OG_LOCALE[locale],
    ogLocaleAlternates: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    ogSiteName: business.tradingName,
    twitterCard: 'summary_large_image',
    alternates,
  };
}

/** JSON-serialize a JSON-LD object with `<` escaped so a value can't break out of the `<script>` block. */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// --- schema.org JSON-LD builders (plain objects; only Breadcrumb/Article/Course/Organization surface as
// Google rich results — WebSite/MusicComposition are entity signals). No FAQ/HowTo/SearchAction: those
// rich results are retired or restricted (see docs/features/seo.md). ---

/** The site operator's identity — publish once, on the home page. */
export function organizationJsonLd(siteUrl?: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: business.tradingName,
    legalName: business.tradingName,
    ...(siteUrl ? { url: siteUrl } : {}),
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'ABN',
      value: business.abnRaw,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: business.contactEmail,
    },
  };
}

/** General site entity signal (name/url/language) — no SearchAction (sitelinks searchbox is retired). */
export function websiteJsonLd(siteName: string, locale: Locale, siteUrl?: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    ...(siteUrl ? { url: siteUrl } : {}),
    inLanguage: htmlLang(locale),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Ordered breadcrumb trail (e.g. Catalogue → Item). Requires absolute URLs. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ArticleJsonLdInput {
  headline: string;
  description?: string;
  image?: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  authorName: string;
}

/** Lesson/article rich-result markup for catalogue items with prose. */
export function articleJsonLd(input: ArticleJsonLdInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    mainEntityOfPage: input.url,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { '@type': 'Person', name: input.authorName },
    publisher: {
      '@type': 'Organization',
      name: business.tradingName,
    },
  };
}

export interface CourseJsonLdInput {
  name: string;
  description?: string;
  url: string;
  siteUrl?: string;
}

/** Collection/course rich-result markup. Course *info* fields (price/rating/duration) are omitted —
 * that variant is deprecated; only the course-list carousel remains supported. */
export function courseJsonLd(input: CourseJsonLdInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    provider: {
      '@type': 'Organization',
      name: business.tradingName,
      ...(input.siteUrl ? { sameAs: input.siteUrl } : {}),
    },
  };
}

export interface MusicCompositionInput {
  name: string;
  composer?: string;
  musicalKey?: string;
  locale: Locale;
}

/** Entity signal for a catalogue piece — captures the enriched `details` facts in a standard vocabulary.
 * No Google music rich result exists; this aids the Knowledge Graph / other engines / AI answers. */
export function musicCompositionJsonLd(input: MusicCompositionInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name: input.name,
    ...(input.composer ? { composer: { '@type': 'Person', name: input.composer } } : {}),
    ...(input.musicalKey ? { musicalKey: input.musicalKey } : {}),
    inLanguage: htmlLang(input.locale),
  };
}

export interface VideoObjectInput {
  /** Video title. */
  name: string;
  description?: string;
  thumbnailUrl: string;
  /** 11-char YouTube id → embed URL. */
  videoId: string;
  /** ISO 8601 upload date; when present the video is eligible for full rich results. */
  uploadDate?: string;
}

/** Markup for a video demonstrating a catalogue piece. `uploadDate` is a Google-required field oEmbed
 * can't supply, so it's emitted only when an author provides it; the rest is always present. */
export function videoObjectJsonLd(input: VideoObjectInput): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    thumbnailUrl: input.thumbnailUrl,
    embedUrl: `https://www.youtube.com/embed/${input.videoId}`,
    ...(input.uploadDate ? { uploadDate: input.uploadDate } : {}),
  };
}
