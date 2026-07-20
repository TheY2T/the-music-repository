/**
 * Builders for the LLM-ingestion surfaces (llmstxt.org): the `/llms.txt` index, the `/llms-full.txt`
 * content dump, and the single-item markdown served via `Accept: text/markdown` content negotiation.
 * Pure string builders — the routes/middleware fetch the data and pass it in, so these unit-test cleanly.
 */

export const SITE_TITLE = 'The Music Repository';
export const SITE_SUMMARY =
  "One of the world's most comprehensive musical repositories for guitar and piano — public-domain " +
  'lessons, songs, sheet music, and interactive practice tools.';

/** A link in the `/llms.txt` index. */
export interface LlmsLink {
  title: string;
  /** Canonical, un-prefixed path (e.g. `/catalogue/fur-elise`). */
  path: string;
  description?: string;
}

/** A titled section of links in the `/llms.txt` index. */
export interface LlmsSection {
  heading: string;
  links: LlmsLink[];
}

/** A content item for the full dump / single-page markdown. */
export interface LlmsItem {
  title: string;
  /** Canonical path, emitted as a source line when present. */
  path?: string;
  summary?: string;
  /** Label/value facts (e.g. `['Key', 'A minor']`). */
  details?: [string, string][];
  /** "What you'll learn" bullets (collections). */
  outcomes?: string[];
  /** The item's prose as markdown (bodyMdx). */
  body?: string;
}

/** A titled section of full items for `/llms-full.txt`. */
export interface LlmsFullSection {
  heading: string;
  items: LlmsItem[];
}

function absolute(site: URL | undefined, path: string): string {
  return site ? new URL(path, site).href : path;
}

/** Collapse whitespace/newlines so a description fits on one markdown list line. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Prepare an item's authored body for inlining: drop the interactive-embed placeholder markers (they
 * point at live islands with no textual meaning) and demote its ATX headings by `shift` levels so they
 * nest beneath the item's own heading rather than competing with the section headings above it.
 */
function cleanBody(body: string, shift: number): string {
  return body
    .replace(/^\s*<div data-tmr-embed="\d+"><\/div>\s*$/gm, '')
    .replace(/^(#{1,6})(?=\s)/gm, (hashes) =>
      shift > 0 ? '#'.repeat(Math.min(hashes.length + shift, 6)) : hashes,
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Build `/llms.txt`: an H1 title, a `>` blockquote summary, then `##` sections of `- [name](url): desc`
 * links. `optional` links are grouped under a trailing `## Optional` section (llmstxt.org marks these as
 * skippable when a shorter context is needed).
 */
export function renderLlmsIndex(opts: {
  site: URL | undefined;
  sections: LlmsSection[];
  optional?: LlmsLink[];
  title?: string;
  summary?: string;
}): string {
  const { site } = opts;
  const line = (l: LlmsLink) =>
    `- [${l.title}](${absolute(site, l.path)})${l.description ? `: ${oneLine(l.description)}` : ''}`;

  const blocks: string[] = [`# ${opts.title ?? SITE_TITLE}`, `> ${opts.summary ?? SITE_SUMMARY}`];
  for (const section of opts.sections) {
    if (section.links.length === 0) continue;
    blocks.push(`## ${section.heading}\n${section.links.map(line).join('\n')}`);
  }
  if (opts.optional && opts.optional.length > 0) {
    blocks.push(`## Optional\n${opts.optional.map(line).join('\n')}`);
  }
  return `${blocks.join('\n\n')}\n`;
}

/** Render one content item as a markdown block (heading level configurable for nesting in the dump). */
export function renderItemMarkdown(
  item: LlmsItem,
  opts: { site?: URL | undefined; headingLevel?: number } = {},
): string {
  const level = opts.headingLevel ?? 1;
  const h = '#'.repeat(level);
  const parts: string[] = [`${h} ${item.title}`];
  if (item.path && opts.site) parts.push(`*Source: ${absolute(opts.site, item.path)}*`);
  if (item.summary) parts.push(`> ${oneLine(item.summary)}`);
  if (item.details && item.details.length > 0) {
    parts.push(item.details.map(([k, v]) => `- **${k}:** ${v}`).join('\n'));
  }
  if (item.outcomes && item.outcomes.length > 0) {
    parts.push(`**What you'll learn:**\n${item.outcomes.map((o) => `- ${o}`).join('\n')}`);
  }
  // Authored bodies top out at `##`; demote them to sit one level below this item's heading.
  if (item.body?.trim()) {
    const cleaned = cleanBody(item.body, Math.max(0, level - 1));
    if (cleaned) parts.push(cleaned);
  }
  return parts.join('\n\n');
}

/**
 * Build `/llms-full.txt`: the H1 + summary header, then each section as `##` with its items inlined as
 * `###` blocks (title, source, summary, details/outcomes, full body markdown).
 */
export function renderLlmsFull(opts: {
  site: URL | undefined;
  sections: LlmsFullSection[];
  title?: string;
  summary?: string;
}): string {
  const blocks: string[] = [`# ${opts.title ?? SITE_TITLE}`, `> ${opts.summary ?? SITE_SUMMARY}`];
  for (const section of opts.sections) {
    if (section.items.length === 0) continue;
    blocks.push(`## ${section.heading}`);
    for (const item of section.items) {
      blocks.push(renderItemMarkdown(item, { site: opts.site, headingLevel: 3 }));
    }
  }
  return `${blocks.join('\n\n')}\n`;
}
