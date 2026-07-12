/**
 * @TheY2T/tmr-i18n — the dependency-free localization engine, the single source of truth for the set
 * of supported locales, URL-prefix routing, and the `t(locale, key)` lookup.
 *
 * Used identically in Astro `.astro` SSR frontmatter and in hydrated React islands: the locale is
 * resolved once server-side (from the URL prefix / cookie / Accept-Language) and threaded into each
 * island as a plain `locale` prop, so the string the island hydrates with matches what the server
 * rendered — no flash, no hydration mismatch. React context is NOT used (it can't cross island
 * boundaries — see apps/web/CLAUDE.md).
 *
 * Scope: web UI strings only. Backend problem+json / mail strings and DB catalogue content are a
 * separate, later concern (see docs/features/i18n.md).
 */
import { type Catalogue, en, type MessageKey, zhHans } from '@TheY2T/tmr-i18n-locales';

export type { MessageKey };

/** Supported locale ids. Chinese uses the script subtag `zh-Hans` (future-proofs Traditional `zh-Hant`). */
export const LOCALES = ['en', 'zh-Hans'] as const;
export type Locale = (typeof LOCALES)[number];

/** The default locale — rendered at the un-prefixed root (`/`). */
export const DEFAULT_LOCALE: Locale = 'en';

/** URL segment prepended per locale. The default locale is un-prefixed; others get `/<seg>`. */
const URL_PREFIX: Record<Locale, string> = {
  en: '',
  'zh-Hans': '/zh',
};

/** Human label for each locale, written in its own script (for the language switcher). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  'zh-Hans': '中文',
};

const CATALOGUES: Record<Locale, Catalogue> = {
  en,
  'zh-Hans': zhHans,
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** The `<html lang>` / `hreflang` value for a locale (currently the id itself; kept as a seam). */
export function htmlLang(locale: Locale): string {
  return locale;
}

/** The URL prefix for a locale (`''` for the default locale, `'/zh'` for zh-Hans). */
export function localePrefix(locale: Locale): string {
  return URL_PREFIX[locale];
}

/**
 * Build a URL path for `path` (a canonical, un-prefixed path like `/catalogue`) in `locale`.
 * The default locale returns the path unchanged; others get the locale prefix.
 */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const prefix = URL_PREFIX[locale];
  if (!prefix) {
    return clean;
  }
  return clean === '/' ? prefix : `${prefix}${clean}`;
}

/**
 * Split a request pathname into its locale + canonical (un-prefixed) path.
 * `/zh/catalogue` → `{ locale: 'zh-Hans', path: '/catalogue' }`; `/catalogue` → `{ 'en', '/catalogue' }`.
 */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  for (const locale of LOCALES) {
    const prefix = URL_PREFIX[locale];
    if (!prefix) {
      continue;
    }
    if (pathname === prefix) {
      return { locale, path: '/' };
    }
    if (pathname.startsWith(`${prefix}/`)) {
      return { locale, path: pathname.slice(prefix.length) };
    }
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** Read a `locale` cookie value from a raw Cookie header, if it names a supported locale. */
export function readLocaleCookie(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) {
    return null;
  }
  const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/);
  if (!match) {
    return null;
  }
  const value = decodeURIComponent(match[1] ?? '');
  return isLocale(value) ? value : null;
}

/** Best-match a supported locale from an `Accept-Language` header (script-aware for `zh-*`). */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) {
    return null;
  }
  const tags = header
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase() ?? '')
    .filter(Boolean);
  for (const tag of tags) {
    if (tag === 'en' || tag.startsWith('en-')) {
      return 'en';
    }
    // zh, zh-cn, zh-hans, zh-sg → Simplified; zh-hant/zh-tw would need a future zh-Hant locale.
    if (tag === 'zh' || tag.startsWith('zh')) {
      return 'zh-Hans';
    }
  }
  return null;
}

/**
 * The locale a visitor prefers when the URL carries no explicit prefix: an explicit `locale` cookie
 * wins, else the `Accept-Language` header, else the default. (Used to redirect the bare root.)
 */
export function preferredLocale(input: {
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  return (
    readLocaleCookie(input.cookie) ?? matchAcceptLanguage(input.acceptLanguage) ?? DEFAULT_LOCALE
  );
}

const INTERPOLATION = /\{(\w+)\}/g;

/**
 * Translate `key` into `locale`, interpolating `{name}` placeholders from `params`.
 * Missing translations fall back to the English string, then to the key itself (never blank).
 */
export function t(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = CATALOGUES[locale][key] ?? CATALOGUES[DEFAULT_LOCALE][key] ?? key;
  if (!params) {
    return template;
  }
  return template.replace(INTERPOLATION, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}
