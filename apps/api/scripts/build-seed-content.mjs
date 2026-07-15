// Build a bundled seed-content module from the authored Markdown files in
// `src/infrastructure/database/content/*.md`.
//
// Why bundle: the seed runs from `dist/` (incl. in the container), where loose `.md` files aren't
// present. Emitting a committed TS module with JSON-stringified strings avoids both the runtime
// file-read problem AND the backtick-escaping hazard of embedding Markdown (with `code` spans)
// directly in a template literal. Regenerate with `pnpm --filter @TheY2T/tmr-api content:build`.
//
// Each source file is YAML-ish frontmatter (simple `key: value` + `[a, b]` arrays) + a Markdown body.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', 'src', 'infrastructure', 'database', 'content');
const outFile = join(here, '..', 'src', 'infrastructure', 'database', 'seed-content.ts');

/** Strip one layer of surrounding single/double quotes. */
function unquote(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/** Parse a `[a, "b", c]` inline array into a trimmed, unquoted, non-empty string list. */
function parseArray(raw) {
  const inner = raw.trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!inner.trim()) return [];
  return inner
    .split(',')
    .map((x) => unquote(x))
    .map((x) => x.trim())
    .filter(Boolean);
}

const EMBED_TOOLS = new Set([
  'score',
  'keyboard',
  'scale-boxes',
  'chord-diagrams',
  'progression',
  'circle-of-fifths',
  'strum',
  'rhythm',
  'chord-board',
  'intervals',
  'fingering',
]);

/**
 * Extract every fenced ```embeds block (each a JSON array of ContentEmbed) from a body. Each block is
 * replaced IN PLACE with one `<div data-tmr-embed="N">` marker per embed (N = index into the returned
 * flat embeds array), so the web renderer can interleave the interactive tool exactly where the block was
 * authored — inline with the prose, replacing a static example. Returns the flat embeds + the marked-up
 * body. Throws on malformed JSON or an unknown `tool` so a typo fails the build.
 */
function extractEmbeds(body, file) {
  const embeds = [];
  const re = /```embeds\s*\n([\s\S]*?)\n```/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(body)) !== null) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (err) {
      throw new Error(`${file}: invalid JSON in \`\`\`embeds block: ${err.message}`);
    }
    if (!Array.isArray(parsed)) throw new Error(`${file}: \`\`\`embeds block must be a JSON array`);
    for (const e of parsed) {
      if (!e || typeof e.tool !== 'string' || !EMBED_TOOLS.has(e.tool)) {
        throw new Error(`${file}: embed has missing/unknown "tool" (${JSON.stringify(e?.tool)})`);
      }
    }
    const markers = parsed
      .map((_, j) => `<div data-tmr-embed="${embeds.length + j}"></div>`)
      .join('\n');
    out += `${body.slice(last, m.index)}\n\n${markers}\n\n`;
    embeds.push(...parsed);
    last = m.index + m[0].length;
  }
  out += body.slice(last);
  const cleaned = out.replace(/\n{3,}/g, '\n\n').trim();
  return { embeds, body: cleaned };
}

/** Split a `<slug>.md` into { frontmatter: Record<string,string>, body: string }. */
function parse(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('missing frontmatter');
  const fm = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { fm, body: m[2].trim() };
}

const files = readdirSync(contentDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

const entries = [];
for (const file of files) {
  const { fm, body: rawBody } = parse(readFileSync(join(contentDir, file), 'utf8'));
  const { embeds, body } = extractEmbeds(rawBody, file);
  const slug = unquote(fm.slug ?? file.replace(/\.md$/, ''));

  // details: only keep non-empty scalar facts; `related` from relatedSlugs.
  const details = {};
  for (const [key, field] of [
    ['key', 'key'],
    ['era', 'era'],
    ['form', 'form'],
    ['timeSignature', 'timeSignature'],
    ['composer', 'composer'],
    ['composerDates', 'composerDates'],
    ['composedYear', 'composedYear'],
  ]) {
    const v = fm[field] ? unquote(fm[field]) : '';
    if (v) details[key] = v;
  }
  const related = fm.relatedSlugs ? parseArray(fm.relatedSlugs) : [];
  if (related.length) details.related = related;
  if (embeds.length) details.embeds = embeds;

  const extraTags = fm.suggestedTags ? parseArray(fm.suggestedTags) : [];

  entries.push({ slug, bodyMdx: body, details, extraTags });
}

entries.sort((a, b) => a.slug.localeCompare(b.slug));

const record = Object.fromEntries(
  entries.map((e) => [e.slug, { bodyMdx: e.bodyMdx, details: e.details, extraTags: e.extraTags }]),
);

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/infrastructure/database/content/*.md
 * Regenerate: pnpm --filter @TheY2T/tmr-api content:build
 *
 * Enriched catalogue content authored via research (${entries.length} items): the Markdown body
 * (rendered on the detail page), structured facts (\`details\`), and suggested tags. Applied by the
 * seed on top of the base metadata in seed-data.ts.
 */
import type { SeedContentExtra } from './content-details';

export const SEED_CONTENT: Record<string, SeedContentExtra> = ${JSON.stringify(record, null, 2)};
`;

writeFileSync(outFile, header);
console.log(`Wrote ${outFile} (${entries.length} items).`);
