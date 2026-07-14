// Fidelity + validity gate for authored scores. Loads every
// `src/infrastructure/database/content/scores/<slug>.musicxml` into Verovio and asserts it parses and
// engraves without error, reports page/measure/note counts, and writes a preview SVG per score into
// the scratchpad for page-by-page proofing against the public-domain reference. Not shipped — a dev QA
// tool. Run with `pnpm --filter @TheY2T/tmr-api scores:validate`.
//
// Requires the `verovio` devDependency (cataloged). If it isn't installed yet, run `pnpm install`.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scoresDir = join(here, '..', 'src', 'infrastructure', 'database', 'content', 'scores');
const previewDir = process.env.SCORE_PREVIEW_DIR ?? join(here, '..', '.score-previews');

let createVerovioModule;
let VerovioToolkit;
try {
  ({ default: createVerovioModule } = await import('verovio/wasm'));
  ({ VerovioToolkit } = await import('verovio/esm'));
} catch (err) {
  console.error(
    'Could not load verovio. Install deps first: `pnpm install` (verovio is a cataloged devDependency).',
  );
  console.error(String(err));
  process.exit(1);
}

const VerovioModule = await createVerovioModule();
const tk = new VerovioToolkit(VerovioModule);
// Compact, fixed layout so previews are deterministic and comparable to a reference PDF.
tk.setOptions({
  scale: 40,
  adjustPageHeight: true,
  breaks: 'auto',
  footer: 'none',
  header: 'none',
});

mkdirSync(previewDir, { recursive: true });

const slugs = readdirSync(scoresDir)
  .filter((f) => f.endsWith('.musicxml'))
  .map((f) => f.replace(/\.musicxml$/, ''))
  .sort();

let failures = 0;
for (const slug of slugs) {
  const xml = readFileSync(join(scoresDir, `${slug}.musicxml`), 'utf8');
  const ok = tk.loadData(xml);
  if (!ok) {
    console.error(`✗ ${slug}: Verovio failed to load the MusicXML`);
    failures += 1;
    continue;
  }
  const pages = tk.getPageCount();
  let svg = '';
  for (let p = 1; p <= pages; p += 1) svg += tk.renderToSVG(p);
  writeFileSync(join(previewDir, `${slug}.svg`), svg);
  const noteCount = (xml.match(/<note>/g) ?? []).length;
  const measureCount = (xml.match(/<measure /g) ?? []).length;
  console.log(`✓ ${slug}: ${pages} page(s), ${measureCount} measures, ${noteCount} notes`);
}

console.log(
  `\n${slugs.length - failures}/${slugs.length} scores engraved. Previews: ${previewDir}`,
);
if (failures > 0) process.exit(1);
