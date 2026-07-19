import type { APIRoute } from 'astro';

// Allow every crawler (search + AI answer engines) and point them at the sitemap index. Private surfaces
// (admin, account, auth) are kept out of the index with a `noindex` meta tag rather than disallowed here,
// so crawlers can still fetch the page and see the directive (a robots.txt disallow would hide it).
export const GET: APIRoute = (context) => {
  const sitemap = context.site
    ? new URL('/sitemap-index.xml', context.site).href
    : '/sitemap-index.xml';
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
