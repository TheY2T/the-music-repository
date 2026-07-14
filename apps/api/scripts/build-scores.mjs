// Build a bundled seed-scores module from the authored score files in
// `src/infrastructure/database/content/scores/`.
//
// Each score is a pair of files keyed by content slug:
//   <slug>.musicxml   — the engraving (MusicXML 3.1 partwise), the single source of truth. The web
//                       ScoreViewer engraves it with Verovio + notation-synced playback, and exports
//                       a downloadable PDF from it client-side.
//   <slug>.meta.json  — provenance/licensing (see ScoreMeta): { origin, source, sourceUrl, license,
//                       attribution }. Recorded on the `musicxml` media asset by the seed.
//
// Why bundle: the seed runs from `dist/` (incl. in the container), where loose files aren't present.
// Emitting a committed TS module with JSON-stringified data avoids the runtime file-read problem and
// the backtick-escaping hazard of embedding MusicXML directly. Regenerate with
// `pnpm --filter @TheY2T/tmr-api scores:build`.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scoresDir = join(here, '..', 'src', 'infrastructure', 'database', 'content', 'scores');
const outFile = join(here, '..', 'src', 'infrastructure', 'database', 'seed-scores.ts');

const ORIGINS = new Set(['openscore', 'kern', 'hand-authored']);

const slugs = readdirSync(scoresDir)
  .filter((f) => f.endsWith('.musicxml'))
  .map((f) => f.replace(/\.musicxml$/, ''))
  .sort();

const xml = {};
const meta = {};

for (const slug of slugs) {
  const musicxml = readFileSync(join(scoresDir, `${slug}.musicxml`), 'utf8').trim();
  if (!musicxml.includes('<score-partwise')) {
    throw new Error(`${slug}.musicxml is not a score-partwise MusicXML document`);
  }
  xml[slug] = musicxml;

  const metaPath = join(scoresDir, `${slug}.meta.json`);
  if (!existsSync(metaPath)) {
    throw new Error(`${slug}.musicxml has no companion ${slug}.meta.json`);
  }
  const m = JSON.parse(readFileSync(metaPath, 'utf8'));
  if (!ORIGINS.has(m.origin)) {
    throw new Error(`${slug}.meta.json has invalid origin "${m.origin}"`);
  }
  if (!m.source || !m.license || !m.attribution) {
    throw new Error(`${slug}.meta.json is missing source/license/attribution`);
  }
  meta[slug] = {
    origin: m.origin,
    source: m.source,
    sourceUrl: m.sourceUrl ?? null,
    license: m.license,
    attribution: m.attribution,
  };
}

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/infrastructure/database/content/scores/<slug>.{musicxml,meta.json}
 * Regenerate: pnpm --filter @TheY2T/tmr-api scores:build
 *
 * Real engraved scores (${slugs.length}) keyed by content slug. The seed (seed.ts) uploads each
 * SCORE_XML entry as a \`musicxml\` media asset and records its SCORE_META provenance/licensing on
 * the asset. The web ScoreViewer engraves it with Verovio + notation-synced playback.
 */
import type { ScoreMeta } from './content-details';

export const SCORE_XML: Record<string, string> = ${JSON.stringify(xml, null, 2)};

export const SCORE_META: Record<string, ScoreMeta> = ${JSON.stringify(meta, null, 2)};
`;

writeFileSync(outFile, header);
console.log(`Wrote ${outFile} (${slugs.length} scores).`);
