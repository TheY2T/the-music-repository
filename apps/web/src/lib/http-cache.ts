/**
 * Cache policy for SSR HTML responses. Anonymous GETs of public pages are eligible for a short
 * shared-cache (edge) window; everything else — authenticated requests, private routes, non-200s — is
 * `no-store`. Defaulting to `no-store` keeps personalized markup out of any shared cache. Callers set
 * `Vary: Cookie` on shared responses so a signed-in visitor is never served the anonymous variant.
 */

/** Routes that render per-viewer content (or gate to a signed-in user) — never cacheable. */
export const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/account',
  '/dashboard',
  '/signin',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

/** Shared-cache Cache-Control for an anonymous public page (browser always revalidates; edge caches). */
export const HTML_SHARED_CACHE_CONTROL =
  'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

/** Non-shareable Cache-Control for authenticated/private/non-200 responses. */
export const HTML_PRIVATE_CACHE_CONTROL = 'private, no-store';

export interface HtmlCacheInput {
  method: string;
  status: number;
  authenticated: boolean;
  /** The canonical (locale-stripped) request path. */
  path: string;
}

export interface HtmlCachePolicy {
  cacheControl: string;
  /** When true the response is edge-cacheable and must carry `Vary: Cookie`. */
  shared: boolean;
}

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function htmlCachePolicy({
  method,
  status,
  authenticated,
  path,
}: HtmlCacheInput): HtmlCachePolicy {
  const shared = method === 'GET' && status === 200 && !authenticated && !isPrivatePath(path);
  return {
    shared,
    cacheControl: shared ? HTML_SHARED_CACHE_CONTROL : HTML_PRIVATE_CACHE_CONTROL,
  };
}
