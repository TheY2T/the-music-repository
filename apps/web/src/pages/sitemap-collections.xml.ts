import { listCollectionSlugs } from '@TheY2T/tmr-web-acl/server-content';
import type { APIRoute } from 'astro';
import { apiBaseUrl } from '@/lib/api-base';
import { renderUrlset, XML_HEADERS } from '@/lib/sitemap';

// Every published collection, enumerated from the API. Empty (still valid) when collections are off or
// the API is unreachable.
export const GET: APIRoute = async (context) => {
  const entries = context.locals.flags.collections
    ? (await listCollectionSlugs({ apiBaseUrl: apiBaseUrl() })).map((slug) => ({
        path: `/collections/${slug}`,
      }))
    : [];
  return new Response(renderUrlset(entries, context.site, context.locals.flags.i18nEnabled), {
    headers: XML_HEADERS,
  });
};
