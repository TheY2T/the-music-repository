#!/usr/bin/env node
/**
 * Populates the self-hosted instrument sample set used by the note service
 * (`packages/music-core/src/soundfont.ts` → smplr `Soundfont`).
 *
 * Each General-MIDI instrument in SOUNDFONT_INSTRUMENTS is downloaded from the
 * FluidR3_GM soundfont (midi-js-soundfonts, CC BY 3.0) as a single self-contained
 * `<name>-mp3.js` file (base64 audio embedded) into
 * `apps/web/public/soundfont/instruments/`, which the app serves from its own
 * origin at runtime. The instrument list is parsed from soundfont.ts so it can't
 * drift from the app's menu.
 *
 * The committed files are the source of truth; run this only to add instruments
 * or refresh the set. Idempotent — existing files are skipped unless --force.
 *
 * Run: `pnpm soundfont:fetch` (add `--force` to re-download).
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOUNDFONT_TS = join(REPO_ROOT, 'packages/music-core/src/soundfont.ts');
const OUT_DIR = join(REPO_ROOT, 'apps/web/public/soundfont/instruments');
const KIT = 'FluidR3_GM';
const FORMAT = 'mp3';
const BASE = `https://gleitz.github.io/midi-js-soundfonts/${KIT}`;
const force = process.argv.includes('--force');

/** Parse the `name: '...'` entries from SOUNDFONT_INSTRUMENTS in soundfont.ts. */
function readInstrumentNames() {
  const src = readFileSync(SOUNDFONT_TS, 'utf8');
  const block = src.match(
    /SOUNDFONT_INSTRUMENTS\s*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  if (!block) throw new Error('Could not find SOUNDFONT_INSTRUMENTS in soundfont.ts');
  const names = [...block[1].matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
  if (!names.length) throw new Error('No instrument names parsed');
  return [...new Set(names)];
}

async function main() {
  const names = readInstrumentNames();
  mkdirSync(OUT_DIR, { recursive: true });
  let downloaded = 0;
  let skipped = 0;

  for (const name of names) {
    const file = `${name}-${FORMAT}.js`;
    const dest = join(OUT_DIR, file);
    if (existsSync(dest) && !force) {
      skipped++;
      continue;
    }
    const url = `${BASE}/${file}`;
    process.stdout.write(`↓ ${file} … `);
    const res = await fetch(url);
    if (!res.ok) {
      process.stdout.write(`FAILED (${res.status})\n`);
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    downloaded++;
    process.stdout.write(`${(buf.length / 1024 / 1024).toFixed(1)} MB\n`);
  }

  process.stdout.write(
    `\nDone. ${names.length} instruments — ${downloaded} downloaded, ${skipped} already present.\n` +
      `Output: ${OUT_DIR}\n`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
