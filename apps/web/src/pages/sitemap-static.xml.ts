import type { APIRoute } from 'astro';
import { enabledToolPaths, renderUrlset, type SitemapEntry, XML_HEADERS } from '@/lib/sitemap';

// Public, non-personalized routes: the content hubs, the enabled interactive tools (from the per-env
// `tools.*` flag snapshot), and the marketing/legal pages. Auth-gated areas (drills, account, admin) are
// intentionally absent — they carry `noindex` and redirect anonymous crawlers.
export const GET: APIRoute = (context) => {
  const { flags, flagSnapshot } = context.locals;
  const entries: SitemapEntry[] = [
    { path: '/' },
    { path: '/catalogue' },
    ...(flags.collections ? [{ path: '/collections' }] : []),
    { path: '/tools' },
    ...enabledToolPaths(flagSnapshot),
    { path: '/about' },
    { path: '/privacy' },
    { path: '/terms' },
    { path: '/cookies' },
  ];
  return new Response(renderUrlset(entries, context.site, flags.i18nEnabled), {
    headers: XML_HEADERS,
  });
};
