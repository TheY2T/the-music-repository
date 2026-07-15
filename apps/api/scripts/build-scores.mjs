// Build a bundled seed-scores module from the authored score files in
// `src/infrastructure/database/content/scores/`.
//
// Each score is a pair of files keyed by content slug (ADR 0027):
//   <slug>.alphatex   — the score in alphaTex, alphaTab's native text format and our single source of
//                       truth. The web player renders + plays it with alphaTab; the downloadable PDF is
//                       produced client-side from the same render.
//   <slug>.meta.json  — provenance/licensing (see ScoreMeta): { origin, source, sourceUrl, license,
//                       attribution, displayMode? }. Recorded on the `alphatex` media asset by the seed.
//
// Why bundle: the seed runs from `dist/` (incl. in the container), where loose files aren't present.
// Emitting a committed TS module with JSON-stringified data avoids the runtime file-read problem.
// Regenerate with `pnpm --filter @TheY2T/tmr-api scores:build`. Author new scores with the `add-score`
// skill; convert legacy MusicXML with `scores:migrate`.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scoresDir = join(here, '..', 'src', 'infrastructure', 'database', 'content', 'scores');
const outFile = join(here, '..', 'src', 'infrastructure', 'database', 'seed-scores.ts');

const ORIGINS = new Set(['openscore', 'kern', 'hand-authored']);
const DISPLAY_MODES = new Set(['standard', 'tab']);

const slugs = readdirSync(scoresDir)
  .filter((f) => f.endsWith('.alphatex'))
  .map((f) => f.replace(/\.alphatex$/, ''))
  .sort();

const tex = {};
const meta = {};

for (const slug of slugs) {
  const alphatex = readFileSync(join(scoresDir, `${slug}.alphatex`), 'utf8').trim();
  if (!alphatex) {
    throw new Error(`${slug}.alphatex is empty`);
  }
  tex[slug] = alphatex;

  const metaPath = join(scoresDir, `${slug}.meta.json`);
  if (!existsSync(metaPath)) {
    throw new Error(`${slug}.alphatex has no companion ${slug}.meta.json`);
  }
  const m = JSON.parse(readFileSync(metaPath, 'utf8'));
  if (!ORIGINS.has(m.origin)) {
    throw new Error(`${slug}.meta.json has invalid origin "${m.origin}"`);
  }
  if (!m.source || !m.license || !m.attribution) {
    throw new Error(`${slug}.meta.json is missing source/license/attribution`);
  }
  if (m.displayMode != null && !DISPLAY_MODES.has(m.displayMode)) {
    throw new Error(`${slug}.meta.json has invalid displayMode "${m.displayMode}"`);
  }
  meta[slug] = {
    origin: m.origin,
    source: m.source,
    sourceUrl: m.sourceUrl ?? null,
    license: m.license,
    attribution: m.attribution,
    ...(m.displayMode ? { displayMode: m.displayMode } : {}),
  };
}

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/infrastructure/database/content/scores/<slug>.{alphatex,meta.json}
 * Regenerate: pnpm --filter @TheY2T/tmr-api scores:build
 *
 * Real scores (${slugs.length}) in alphaTex keyed by content slug (ADR 0027). The seed (seed.ts) uploads
 * each SCORE_ALPHATEX entry as an \`alphatex\` media asset and records its SCORE_META provenance/licensing
 * on the asset. The web score player renders + plays it with alphaTab.
 */
import type { ScoreMeta } from './content-details';

export const SCORE_ALPHATEX: Record<string, string> = ${JSON.stringify(tex, null, 2)};

export const SCORE_META: Record<string, ScoreMeta> = ${JSON.stringify(meta, null, 2)};
`;

writeFileSync(outFile, header);
console.log(`Wrote ${outFile} (${slugs.length} scores).`);
