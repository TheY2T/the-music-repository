/**
 * `Accept: text/markdown` content negotiation helpers. LLM crawlers (and Cloudflare's AI features) can ask
 * for markdown; when they do, the middleware serves a clean markdown rendering of the page instead of HTML
 * (with `Vary: Accept` so caches keep the variants separate).
 */
import { NodeHtmlMarkdown } from 'node-html-markdown';

interface AcceptType {
  type: string;
  q: number;
}

function parseAccept(accept: string): AcceptType[] {
  return accept.split(',').map((part) => {
    const [type, ...params] = part.trim().split(';');
    const qParam = params.find((p) => p.trim().startsWith('q='));
    const q = qParam ? Number.parseFloat(qParam.slice(qParam.indexOf('=') + 1)) : 1;
    return { type: type.trim().toLowerCase(), q: Number.isNaN(q) ? 1 : q };
  });
}

/** True when the client explicitly prefers markdown over HTML (never for a normal browser). */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const types = parseAccept(accept);
  const md = types.find((t) => t.type === 'text/markdown' || t.type === 'text/x-markdown');
  if (!md || md.q <= 0) return false;
  const html = types.find((t) => t.type === 'text/html');
  return !html || md.q >= html.q;
}

/**
 * Convert a rendered HTML page to markdown by extracting its single `<main>` content region (BaseLayout
 * owns one `<main>`, so no chrome leaks in) and converting that. Returns null when there's no `<main>` or
 * the conversion is empty, so the caller can fall back to serving the original HTML.
 */
export function htmlToMarkdown(html: string): string | null {
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const inner = match?.[1];
  if (!inner) return null;
  const markdown = NodeHtmlMarkdown.translate(inner).trim();
  return markdown.length > 0 ? markdown : null;
}

/** Headers for a negotiated markdown response. */
export const MARKDOWN_HEADERS = {
  'Content-Type': 'text/markdown; charset=utf-8',
  Vary: 'Accept',
} as const;
