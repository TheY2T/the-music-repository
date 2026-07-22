/**
 * `Cache-Control` policies for the API's public read endpoints, used with Nest's `@Header()` decorator
 * (or `res.setHeader`) so responses are eligible for shared (Cloudflare) and browser caching.
 *
 * `s-maxage` is the shared-cache (edge) freshness window; `max-age` the browser window (kept short for
 * viewer-varying reads); `stale-while-revalidate` lets the edge serve a slightly stale response while it
 * revalidates in the background, so a cache miss never blocks on the origin. Personalized responses use
 * {@link CACHE_PRIVATE}. Cloudflare additionally bypasses the cache when an auth cookie is present, so a
 * `public` response is never shared across signed-in viewers.
 */

/** Listings and search results that turn over as content is published. */
export const CACHE_PUBLIC_SHORT = 'public, max-age=30, s-maxage=120, stale-while-revalidate=600';

/** Stable detail and reference reads (a single item, help topic, locale/flag metadata). */
export const CACHE_PUBLIC_MEDIUM = 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600';

/** Per-viewer or otherwise non-shareable responses. */
export const CACHE_PRIVATE = 'private, no-store';
