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
 * Storage: message values live in the database and are edited via the admin CMS
 * (ADR 0034). This engine resolves `t()` against a mutable per-locale REGISTRY that the host populates
 * at runtime — server-side in `apps/web` middleware before SSR, and client-side from a serialized blob
 * before islands hydrate. The bundled JSON (`@TheY2T/tmr-i18n-locales`) is demoted to two jobs: it is
 * the compile-time source of `MessageKey` (so `t()` call sites stay type-checked) and the last-resort
 * FALLBACK when the registry is empty (fresh boot before the catalogue loads, or the API is briefly
 * unreachable) — so `t()` still never renders blank. The same JSON seeds the database baseline.
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

/**
 * Last-resort catalogue, bundled at build time. Used only when the runtime REGISTRY has no entry for a
 * locale/key (cold boot, or the API is unreachable) — the database is the real source of truth.
 */
const FALLBACK: Record<Locale, Catalogue> = {
  en,
  'zh-Hans': zhHans,
};

/**
 * Runtime source of truth: the published catalogue for each locale, keyed by locale. Each value is a
 * whole frozen reference that `loadCatalogue` swaps atomically — never mutated in place — so a
 * synchronous `t()` (which never awaits) can never observe a half-updated map, and concurrent SSR
 * renders sharing this module state each see one internally-consistent snapshot.
 */
const REGISTRY = new Map<Locale, Readonly<Record<string, string>>>();
let REGISTRY_VERSION = '';

/** The serialized catalogue the server hands the browser (embedded in the page, hydrated pre-island). */
export interface SerializedCatalogue {
  version: string;
  locale: Locale;
  messages: Record<string, string>;
  /** The default-locale (`en`) messages, present when `locale` is not `en`, for the fallback chain. */
  fallback?: Record<string, string>;
}

/**
 * Replace the catalogue for one locale (whole-reference swap; callers must not mutate `messages`
 * afterwards). Idempotent per version. Populated by the host: server-side before SSR, client-side
 * before islands hydrate.
 */
export function loadCatalogue(
  locale: Locale,
  messages: Record<string, string>,
  version: string,
): void {
  REGISTRY.set(locale, messages);
  REGISTRY_VERSION = version;
}

/** The version tag of the currently-loaded catalogue (also the served ETag). Empty before first load. */
export function getCatalogueVersion(): string {
  return REGISTRY_VERSION;
}

/** Whether a runtime catalogue has been loaded for `locale` (false ⇒ `t()` uses the bundled fallback). */
export function hasCatalogue(locale: Locale): boolean {
  return REGISTRY.has(locale);
}

/**
 * Client-side bootstrap: read the `<script id="i18n-catalogue" type="application/json">` blob the server
 * embedded and load it into the REGISTRY. Runs from a `<head>` module before any island renders, so
 * `t()` in the browser resolves from the same catalogue the server rendered with. No-op on the server
 * or when the blob is absent/malformed (the bundled fallback then covers `t()`).
 */
export function hydrateCatalogueFromDom(): void {
  // Reach the DOM through globalThis so this package needs no `dom` lib (it also runs on the server).
  const doc = (
    globalThis as {
      document?: { getElementById(id: string): { textContent: string | null } | null };
    }
  ).document;
  const el = doc?.getElementById('i18n-catalogue');
  if (!el?.textContent) {
    return;
  }
  try {
    const blob = JSON.parse(el.textContent) as SerializedCatalogue;
    if (blob.fallback) {
      loadCatalogue(DEFAULT_LOCALE, blob.fallback, blob.version);
    }
    loadCatalogue(blob.locale, blob.messages, blob.version);
  } catch {
    // Malformed blob → leave the REGISTRY empty; `t()` falls back to the bundled catalogue.
  }
}

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
 * Resolution order (never blank): the runtime catalogue for `locale`, then the default-locale runtime
 * catalogue, then the bundled fallback for `locale`, then the bundled default, then the key itself.
 */
export function t(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template =
    REGISTRY.get(locale)?.[key] ??
    REGISTRY.get(DEFAULT_LOCALE)?.[key] ??
    FALLBACK[locale][key] ??
    FALLBACK[DEFAULT_LOCALE][key] ??
    key;
  if (!params) {
    return template;
  }
  return template.replace(INTERPOLATION, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}
