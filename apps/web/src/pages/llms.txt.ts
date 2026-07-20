import type { APIRoute } from 'astro';
import { renderLlmsIndex } from '@/lib/llms';
import { collectLlmsIndex } from '@/lib/llms-sources';

// The llmstxt.org index: a titled, sectioned list of the site's content + pages for LLM ingestion,
// generated from live content. Companion to /llms-full.txt (full content) and the per-page
// `Accept: text/markdown` negotiation. Empty-but-valid if the API is unreachable.
export const GET: APIRoute = async (context) => {
  const { sections, optional } = await collectLlmsIndex(context.locals);
  const body = renderLlmsIndex({ site: context.site, sections, optional });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
