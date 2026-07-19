import { listContentSlugs } from '@TheY2T/tmr-web-acl/server-content';
import type { APIRoute } from 'astro';
import { apiBaseUrl } from '@/lib/api-base';
import { renderUrlset, XML_HEADERS } from '@/lib/sitemap';

// Every published catalogue item, enumerated from the API. Empty (still valid) if the API is unreachable.
export const GET: APIRoute = async (context) => {
  const slugs = await listContentSlugs({ apiBaseUrl: apiBaseUrl() });
  const entries = slugs.map((slug) => ({ path: `/catalogue/${slug}` }));
  return new Response(renderUrlset(entries, context.site, context.locals.flags.i18nEnabled), {
    headers: XML_HEADERS,
  });
};
