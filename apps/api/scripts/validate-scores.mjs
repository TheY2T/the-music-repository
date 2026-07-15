// Validity gate for authored alphaTex (ADR 0027 · ADR 0028). Parses, with alphaTab's AlphaTexImporter,
// BOTH (a) every `src/infrastructure/database/content/scores/<slug>.alphatex` score-media file and
// (b) every inline `score` embed `tex` authored in a content article's ```embeds block — asserting each
// produces a non-empty score model, so a truncated/broken score OR a malformed inline embed is caught
// before the seed. (The content:build gate only checks the embed JSON shape + tool name, not that the
// alphaTex parses — this is the parse gate.) Visual proofing is still done in the browser. Not shipped —
// a dev QA tool. Run with `pnpm --filter @TheY2T/tmr-api scores:validate`.
//
// Requires the `@coderline/alphatab` devDependency (cataloged). If missing, run `pnpm install`.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let at;
try {
  at = await import('@coderline/alphatab');
} catch (err) {
  console.error('Could not load @coderline/alphatab. Run `pnpm install` first.');
  console.error(String(err));
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', 'src', 'infrastructure', 'database', 'content');
const scoresDir = join(contentDir, 'scores');

/** Parse alphaTex → the score model, asserting it's non-empty; returns { tracks, bars, beats }. */
function parseAlphaTex(tex) {
  const importer = new at.importer.AlphaTexImporter();
  importer.initFromString(tex, new at.Settings());
  const score = importer.readScore();
  const staff = score.tracks[0]?.staves[0];
  const bars = staff?.bars.length ?? 0;
  const beats = staff?.bars.reduce((n, b) => n + b.voices[0].beats.length, 0) ?? 0;
  if (!score.tracks.length || bars === 0 || beats === 0) {
    throw new Error('parsed to an empty score (no tracks/bars/beats)');
  }
  return { tracks: score.tracks.length, bars, beats };
}

let failures = 0;
let checked = 0;

// (a) Score-media files.
const slugs = readdirSync(scoresDir)
  .filter((f) => f.endsWith('.alphatex'))
  .map((f) => f.replace(/\.alphatex$/, ''))
  .sort();
for (const slug of slugs) {
  checked += 1;
  try {
    const { tracks, bars, beats } = parseAlphaTex(
      readFileSync(join(scoresDir, `${slug}.alphatex`), 'utf8'),
    );
    console.log(`✓ ${slug}: ${tracks} track(s), ${bars} bars, ${beats} beats`);
  } catch (err) {
    console.error(`✗ ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    failures += 1;
  }
}

// (b) Inline `score` embeds authored in content articles' ```embeds blocks.
const mdFiles = readdirSync(contentDir)
  .filter((f) => f.endsWith('.md'))
  .sort();
for (const file of mdFiles) {
  const body = readFileSync(join(contentDir, file), 'utf8');
  const m = body.match(/```embeds\s*\n([\s\S]*?)\n```/);
  if (!m) continue;
  let embeds;
  try {
    embeds = JSON.parse(m[1]);
  } catch {
    continue; // malformed JSON is the content:build gate's job to report
  }
  const scoreEmbeds = (Array.isArray(embeds) ? embeds : []).filter(
    (e) => e?.tool === 'score' && typeof e.tex === 'string',
  );
  scoreEmbeds.forEach((e, i) => {
    checked += 1;
    const label = `${file} embed[${i}]`;
    try {
      const { bars, beats } = parseAlphaTex(e.tex);
      console.log(`✓ ${label}: ${bars} bars, ${beats} beats`);
    } catch (err) {
      console.error(`✗ ${label}: ${err instanceof Error ? err.message : String(err)}`);
      failures += 1;
    }
  });
}

console.log(
  `\n${checked - failures}/${checked} alphaTex sources parsed (scores + inline score embeds).`,
);
if (failures > 0) process.exit(1);
