import type { APIRoute } from 'astro';
import { renderLlmsFull } from '@/lib/llms';
import { collectLlmsFull } from '@/lib/llms-sources';

// The full-content llmstxt.org variant: every catalogue item + collection inlined as markdown, plus FAQ
// and tool/page descriptions. This fetches each item's body, so it's cached in-process (~15 min) to avoid
// re-hitting the API on every crawl.
const TTL_MS = 15 * 60 * 1000;
let cache: { body: string; at: number; site: string } | null = null;

export const GET: APIRoute = async (context) => {
  const siteKey = context.site?.href ?? '';
  const now = Date.now();
  if (cache && cache.site === siteKey && now - cache.at < TTL_MS) {
    return new Response(cache.body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const sections = await collectLlmsFull(context.locals);
  const body = renderLlmsFull({ site: context.site, sections });
  cache = { body, at: now, site: siteKey };
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
