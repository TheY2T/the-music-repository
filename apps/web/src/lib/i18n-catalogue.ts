import { DEFAULT_LOCALE, type Locale, loadCatalogue } from '@TheY2T/tmr-i18n';
import type { I18nCatalogue } from '@TheY2T/tmr-web-acl';

// SSR runs on the server, so it needs a server-reachable API origin (see middleware.ts for the rationale).
const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const TTL_MS = 5_000;
const FETCH_TIMEOUT_MS = 500;

interface Entry {
  version: string;
  messages: Record<string, string>;
  checkedAt: number;
}

// Web-process in-memory cache, shared across requests. Read-only catalogue data keyed by locale — all
// requests want the same published catalogue, so a global cache is correct (no per-request state).
const cache = new Map<Locale, Entry>();

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    // API unreachable / timed out → caller keeps its last-good cache (or the engine's bundled fallback).
    return null;
  }
}

/** Refresh `locale`'s cache entry if stale, revalidating cheaply against `/i18n/version` first. */
async function refresh(locale: Locale): Promise<void> {
  const existing = cache.get(locale);
  const now = Date.now();
  if (existing && now - existing.checkedAt < TTL_MS) {
    return;
  }
  const versions = await fetchJson<{ versions: Record<string, string> }>('/i18n/version');
  const latest = versions?.versions?.[locale];
  if (existing && latest && latest === existing.version) {
    existing.checkedAt = now; // unchanged — skip the full catalogue download
    return;
  }
  const snapshot = await fetchJson<{ version: string; messages: Record<string, string> }>(
    `/i18n/catalogue/${locale}`,
  );
  if (snapshot) {
    cache.set(locale, { version: snapshot.version, messages: snapshot.messages, checkedAt: now });
  } else if (existing) {
    existing.checkedAt = now; // fetch failed → keep last-good (stale-while-error)
  }
}

/**
 * Ensure the runtime catalogue for `locale` (and the default-locale fallback) is loaded into the i18n
 * engine for this SSR render, and return the serializable blob for `Astro.locals.i18nCatalogue`. On any
 * failure the engine falls back to its bundled baseline, so the page always renders.
 */
export async function ensureCatalogue(locale: Locale): Promise<I18nCatalogue> {
  await refresh(locale);
  if (locale !== DEFAULT_LOCALE) {
    await refresh(DEFAULT_LOCALE);
  }

  const active = cache.get(locale);
  const fallbackEntry = cache.get(DEFAULT_LOCALE);
  const version = active?.version ?? fallbackEntry?.version ?? '0';

  if (fallbackEntry) {
    loadCatalogue(DEFAULT_LOCALE, fallbackEntry.messages, fallbackEntry.version);
  }
  if (active) {
    loadCatalogue(locale, active.messages, active.version);
  }

  return {
    version,
    locale,
    messages: active?.messages ?? {},
    fallback: locale !== DEFAULT_LOCALE ? fallbackEntry?.messages : undefined,
  };
}
