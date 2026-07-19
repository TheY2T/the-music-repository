// Shared shell types for the web data seam. The Astro app derives its `App.Locals` from these
// (apps/web/src/env.d.ts) so middleware, nav, and smart components stay in sync on one source.

export type Locale = 'en' | 'zh-Hans';

/**
 * The DB-backed UI-string catalogue the middleware resolves per request (ADR 0034) and hands to
 * `BaseLayout`, which serializes it into the page so client islands hydrate `t()` from the same
 * strings the server rendered. `fallback` carries the default-locale (`en`) map when `locale` ≠ `en`.
 */
export interface I18nCatalogue {
  version: string;
  locale: Locale;
  messages: Record<string, string>;
  fallback?: Record<string, string>;
}

// `Flags` (the per-request feature-flag values) is derived from the typed registry in `./flags` so it can
// never drift from `@TheY2T/tmr-flags`. Re-exported here for the historical `import { Flags }` path.
export type { FlagField, Flags } from './flags';
export { FLAG_FIELD_BY_KEY } from './flags';

/** Authenticated user resolved per request from the API session, or null when anonymous. */
export type User = {
  id: string;
  email: string;
  name: string;
  role: string | null;
} | null;
