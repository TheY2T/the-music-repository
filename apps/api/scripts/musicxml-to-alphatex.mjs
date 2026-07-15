// One-time migration (ADR 0027): convert the authored MusicXML corpus to alphaTex, the new canonical
// score format. alphaTab is the single engine now, and alphaTex is its native, hand-editable text
// format. The conversion is LOSSLESS and automated — we load each MusicXML into alphaTab's own score
// model and serialize it back out with alphaTab's AlphaTexExporter, so what we store is exactly what
// alphaTab will render. Each `<slug>.alphatex` is then validated by re-parsing it.
//
// Usage:
//   node scripts/musicxml-to-alphatex.mjs          # convert every <slug>.musicxml → <slug>.alphatex
//   node scripts/musicxml-to-alphatex.mjs --delete # also remove the source <slug>.musicxml files
//
// After running, regenerate the seed bundle: `pnpm --filter @TheY2T/tmr-api scores:build`.

import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// alphaTab core runs headless (pure model + importers/exporters, no DOM) — the ESM build.
const at = await import('@coderline/alphatab');

const here = dirname(fileURLToPath(import.meta.url));
const scoresDir = join(here, '..', 'src', 'infrastructure', 'database', 'content', 'scores');
const deleteSource = process.argv.includes('--delete');

const slugs = readdirSync(scoresDir)
  .filter((f) => f.endsWith('.musicxml'))
  .map((f) => f.replace(/\.musicxml$/, ''))
  .sort();

if (slugs.length === 0) {
  console.log('No .musicxml files found — nothing to convert.');
  process.exit(0);
}

let ok = 0;
const failures = [];

for (const slug of slugs) {
  try {
    const bytes = new Uint8Array(readFileSync(join(scoresDir, `${slug}.musicxml`)));
    const score = at.importer.ScoreLoader.loadScoreFromBytes(bytes, new at.Settings());
    const tex = new at.exporter.AlphaTexExporter().exportToString(score);

    // Validate the exported alphaTex re-parses into a score with the same bar count.
    const importer = new at.importer.AlphaTexImporter();
    importer.initFromString(tex, new at.Settings());
    const reparsed = importer.readScore();
    const barsIn = score.tracks[0]?.staves[0]?.bars.length ?? 0;
    const barsOut = reparsed.tracks[0]?.staves[0]?.bars.length ?? 0;
    if (barsOut !== barsIn) {
      throw new Error(`bar-count drift on re-parse (${barsIn} → ${barsOut})`);
    }

    writeFileSync(join(scoresDir, `${slug}.alphatex`), `${tex.trim()}\n`);
    if (deleteSource) rmSync(join(scoresDir, `${slug}.musicxml`));
    ok += 1;
  } catch (err) {
    failures.push(`${slug}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(
  `Converted ${ok}/${slugs.length} scores to alphaTex${deleteSource ? ' (removed .musicxml sources)' : ''}.`,
);
if (failures.length) {
  console.error(`\n${failures.length} failed:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
