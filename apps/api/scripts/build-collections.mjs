// Build a bundled seed-collections module from the authored Markdown files in
// `src/infrastructure/database/content/collections/*.md`.
//
// Why bundle: the seed runs from `dist/` (incl. in the container), where loose `.md` files aren't
// present. Emitting a committed TS module with JSON-stringified data avoids the runtime file-read
// problem and the backtick-escaping hazard of embedding Markdown directly. Regenerate with
// `pnpm --filter @TheY2T/tmr-api collections:build`.
//
// File format (frontmatter + Markdown body):
//   ---
//   slug: baroque-keyboard-essentials
//   title: Baroque Keyboard Essentials
//   kind: course            # course | path | syllabus | songlist
//   summary: One-line card blurb.
//   curator: The Music Repository
//   curatorBio: Optional curator bio.
//   featured: true
//   difficultyMin: 2
//   difficultyMax: 6
//   estMinutes: 300
//   accent: heritage
//   tags: [piano, baroque]
//   era: [Baroque]          # → facets.era; likewise genre/technique/mood/instrument
//   ---
//   Free Markdown description → bodyMdx (everything before the first `## Outcomes` / `## Section:`).
//
//   ## Outcomes
//   - Bullet → outcomes[]
//
//   ## Section: First Steps
//   Optional section description line(s).
//   - content-slug (note: focus tip; skills: [reading, phrasing])
//   - another-content-slug

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', 'src', 'infrastructure', 'database', 'content', 'collections');
const outFile = join(here, '..', 'src', 'infrastructure', 'database', 'seed-collections.ts');

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

/** Split a file into { frontmatter: Record<string,string>, body: string }. */
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

/** Parse `- slug (note: ...; skills: [a, b])` → { contentSlug, curatorNote, focusSkills }. */
function parseItem(line) {
  const stripped = line.replace(/^-\s*/, '').trim();
  const paren = stripped.match(/^([a-z0-9-]+)\s*(?:\((.*)\))?$/i);
  if (!paren) return null;
  const contentSlug = paren[1];
  let curatorNote = null;
  let focusSkills = [];
  const meta = paren[2];
  if (meta) {
    const skills = meta.match(/skills:\s*(\[[^\]]*\])/i);
    if (skills) focusSkills = parseArray(skills[1]);
    const note = meta.match(/note:\s*([^;]+?)(?:;\s*skills:|$)/i);
    if (note) curatorNote = note[1].trim();
  }
  return { contentSlug, curatorNote, focusSkills };
}

/** Split the Markdown body into { bodyMdx, outcomes, sections }. */
function parseBody(body) {
  const lines = body.split('\n');
  const bodyLines = [];
  const outcomes = [];
  const sections = [];
  let mode = 'body'; // body | outcomes | section
  let current = null; // active section

  for (const line of lines) {
    const sectionHeading = line.match(/^##\s*Section:\s*(.+)$/i);
    if (sectionHeading) {
      current = { title: sectionHeading[1].trim(), description: null, items: [] };
      sections.push(current);
      mode = 'section';
      continue;
    }
    if (/^##\s*Outcomes\s*$/i.test(line)) {
      mode = 'outcomes';
      continue;
    }
    if (mode === 'body') {
      bodyLines.push(line);
    } else if (mode === 'outcomes') {
      const b = line.match(/^-\s*(.+)$/);
      if (b) outcomes.push(b[1].trim());
    } else if (mode === 'section' && current) {
      if (/^-\s*/.test(line)) {
        const item = parseItem(line);
        if (item) current.items.push(item);
      } else if (line.trim()) {
        current.description = (current.description ? `${current.description} ` : '') + line.trim();
      }
    }
  }
  return { bodyMdx: bodyLines.join('\n').trim() || null, outcomes, sections };
}

function toBool(v) {
  return v != null && /^(true|yes|1)$/i.test(unquote(v));
}
function toInt(v) {
  if (v == null) return null;
  const n = Number.parseInt(unquote(v), 10);
  return Number.isFinite(n) ? n : null;
}

const files = readdirSync(contentDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

const docs = files.map((file) => {
  const { fm, body } = parse(readFileSync(join(contentDir, file), 'utf8'));
  const slug = unquote(fm.slug ?? file.replace(/\.md$/, ''));
  const { bodyMdx, outcomes, sections } = parseBody(body);
  const facets = {};
  for (const key of ['era', 'genre', 'technique', 'mood', 'instrument']) {
    if (fm[key]) facets[key] = parseArray(fm[key]);
  }
  return {
    slug,
    title: unquote(fm.title ?? slug),
    kind: unquote(fm.kind ?? 'course'),
    summary: fm.summary ? unquote(fm.summary) : null,
    bodyMdx,
    curatorName: fm.curator ? unquote(fm.curator) : null,
    curatorBio: fm.curatorBio ? unquote(fm.curatorBio) : null,
    featured: toBool(fm.featured),
    difficultyMin: toInt(fm.difficultyMin),
    difficultyMax: toInt(fm.difficultyMax),
    estMinutes: toInt(fm.estMinutes),
    accent: fm.accent ? unquote(fm.accent) : null,
    tags: fm.tags ? parseArray(fm.tags) : [],
    facets,
    outcomes,
    sections,
  };
});

docs.sort((a, b) => a.slug.localeCompare(b.slug));

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/infrastructure/database/content/collections/*.md
 * Regenerate: pnpm --filter @TheY2T/tmr-api collections:build
 *
 * Fully-authored collections (${docs.length}): metadata, rich description, outcomes, and chaptered
 * sections with per-item curator notes. Applied by the seed (seed.ts).
 */
import type { SeedCollectionDoc } from './content-details';

export const SEED_COLLECTIONS: SeedCollectionDoc[] = ${JSON.stringify(docs, null, 2)};
`;

writeFileSync(outFile, header);
const itemCount = docs.reduce((n, d) => n + d.sections.reduce((m, s) => m + s.items.length, 0), 0);
console.log(`Wrote ${outFile} (${docs.length} collections, ${itemCount} items).`);
