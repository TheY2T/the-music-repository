/**
 * The server-reachable API origin for SSR reads (page-metadata fetches, sitemap enumeration). Inside a
 * container the browser's `PUBLIC_API_BASE_URL` (`http://localhost:3000`) points at the web container
 * itself, so SSR must prefer the server-only `API_INTERNAL_URL` (the compose service name). Falls back to
 * the public URL for host dev where SSR runs on the host. Mirrors the origin resolution in middleware.ts.
 */
export function apiBaseUrl(): string {
  return process.env.API_INTERNAL_URL ?? process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
}
