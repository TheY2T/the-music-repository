// Validity gate for authored scores (ADR 0027). Parses every
// `src/infrastructure/database/content/scores/<slug>.alphatex` with alphaTab's AlphaTexImporter and
// asserts it produces a non-empty score model, reporting track/staff/bar/beat counts so a regression
// (an empty or truncated score) is caught before it reaches the seed. Visual proofing against the
// public-domain reference is done in the browser (alphaTab renders in a real DOM). Not shipped — a dev
// QA tool. Run with `pnpm --filter @TheY2T/tmr-api scores:validate`.
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
const scoresDir = join(here, '..', 'src', 'infrastructure', 'database', 'content', 'scores');

const slugs = readdirSync(scoresDir)
  .filter((f) => f.endsWith('.alphatex'))
  .map((f) => f.replace(/\.alphatex$/, ''))
  .sort();

let failures = 0;
for (const slug of slugs) {
  try {
    const tex = readFileSync(join(scoresDir, `${slug}.alphatex`), 'utf8');
    const importer = new at.importer.AlphaTexImporter();
    importer.initFromString(tex, new at.Settings());
    const score = importer.readScore();
    const staff = score.tracks[0]?.staves[0];
    const bars = staff?.bars.length ?? 0;
    const beats = staff?.bars.reduce((n, b) => n + b.voices[0].beats.length, 0) ?? 0;
    if (!score.tracks.length || bars === 0 || beats === 0) {
      throw new Error('parsed to an empty score (no tracks/bars/beats)');
    }
    console.log(`✓ ${slug}: ${score.tracks.length} track(s), ${bars} bars, ${beats} beats`);
  } catch (err) {
    console.error(`✗ ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    failures += 1;
  }
}

console.log(`\n${slugs.length - failures}/${slugs.length} scores parsed.`);
if (failures > 0) process.exit(1);
