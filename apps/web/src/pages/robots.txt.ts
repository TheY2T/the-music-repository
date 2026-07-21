import type { APIRoute } from 'astro';

// Allow every crawler (search + AI answer engines) and point them at the sitemap index. Private surfaces
// (admin, account, auth) are kept out of the index with a `noindex` meta tag rather than disallowed here,
// so crawlers can still fetch the page and see the directive (a robots.txt disallow would hide it).
export const GET: APIRoute = (context) => {
  // Non-production environments (dev/uat) are private: disallow all crawling outright.
  if ((process.env.APP_ENV ?? 'dev') !== 'production') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const sitemap = context.site
    ? new URL('/sitemap-index.xml', context.site).href
    : '/sitemap-index.xml';
  const llms = context.site ? new URL('/llms.txt', context.site).href : '/llms.txt';
  // A `# LLM index` comment points AI answer engines at the llmstxt.org file (no standard robots
  // directive for it). Every route also answers `Accept: text/markdown` with a markdown rendering.
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n\n# LLM index (llmstxt.org): ${llms}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
