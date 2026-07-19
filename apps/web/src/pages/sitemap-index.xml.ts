import type { APIRoute } from 'astro';
import { renderSitemapIndex, XML_HEADERS } from '@/lib/sitemap';

// Sitemap index: points crawlers at the type-segmented child sitemaps. Referenced from robots.txt.
export const GET: APIRoute = (context) =>
  new Response(
    renderSitemapIndex(
      ['/sitemap-static.xml', '/sitemap-catalogue.xml', '/sitemap-collections.xml'],
      context.site,
    ),
    { headers: XML_HEADERS },
  );
