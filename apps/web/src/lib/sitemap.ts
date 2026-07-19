/**
 * XML sitemap rendering. The site is fully SSR with API-driven dynamic routes, so sitemaps are generated
 * by endpoint routes (`src/pages/sitemap-*.xml.ts`) rather than a static integration. hreflang alternates
 * are emitted on the pages themselves (BaseLayout), so a sitemap's job here is URL *discovery*: each
 * canonical path contributes one `<loc>` per active locale. `<priority>`/`<changefreq>` are omitted —
 * Google ignores them.
 */
import { LOCALES, type Locale, localizedPath } from '@TheY2T/tmr-i18n';

export interface SitemapEntry {
  /** Canonical, un-prefixed path (e.g. `/catalogue/fur-elise`). */
  path: string;
  /** ISO 8601 last-modified, emitted only when reliably known. */
  lastmod?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absolute(site: URL | undefined, path: string): string {
  return site ? new URL(path, site).href : path;
}

/** Render a `<urlset>` — one `<loc>` per (entry × active locale). */
export function renderUrlset(
  entries: SitemapEntry[],
  site: URL | undefined,
  i18nEnabled: boolean,
): string {
  const locales: Locale[] = i18nEnabled ? [...LOCALES] : ['en'];
  const urls = entries.flatMap((entry) =>
    locales.map((locale) => {
      const loc = escapeXml(absolute(site, localizedPath(locale, entry.path)));
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url><loc>${loc}</loc>${lastmod}</url>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/** Render a `<sitemapindex>` pointing at the given child-sitemap paths. */
export function renderSitemapIndex(childPaths: string[], site: URL | undefined): string {
  const items = childPaths.map(
    (path) => `  <sitemap><loc>${escapeXml(absolute(site, path))}</loc></sitemap>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</sitemapindex>\n`;
}

export const XML_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8' } as const;

/** Enabled `/tools/<slug>` paths, derived from the per-environment `tools.*` flag snapshot. */
export function enabledToolPaths(flagSnapshot: Record<string, boolean>): SitemapEntry[] {
  return Object.entries(flagSnapshot)
    .filter(([key, on]) => on && key.startsWith('tools.'))
    .map(([key]) => ({ path: `/tools/${key.slice('tools.'.length)}` }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
