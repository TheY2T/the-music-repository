// Dev-time importer: converts the MIT-licensed @tombatossals/chords-db fretted-chord voicings into
// `src/chord-voicings.generated.ts` — our `ChordShape` shape with absolute frets plus finger + barre
// data. Run with `pnpm --filter @TheY2T/tmr-music-core chords:import`. The generated file is committed;
// this script only re-runs when we want to refresh or widen coverage.

import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const guitarDb = require('@tombatossals/chords-db/lib/guitar.json');
const ukuleleDb = require('@tombatossals/chords-db/lib/ukulele.json');

// chords-db chord `key` string → pitch class.
const KEY_TO_PC = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

// chords-db suffix → [ our CHORDS quality key, display symbol ]. Only qualities the `CHORDS` table
// knows are imported; chords-db's extra/altered suffixes (alt, 7sg, 9#11, slash chords, …) are skipped.
const SUFFIX_MAP = {
  major: ['major', ''],
  minor: ['minor', 'm'],
  dim: ['diminished', 'dim'],
  dim7: ['diminished-7', 'dim7'],
  sus2: ['sus2', 'sus2'],
  sus4: ['sus4', 'sus4'],
  '7sus4': ['dominant-7-sus4', '7sus4'],
  aug: ['augmented', 'aug'],
  6: ['sixth', '6'],
  69: ['six-nine', '6/9'],
  7: ['dominant-7', '7'],
  aug7: ['augmented-7', '7#5'],
  9: ['dominant-9', '9'],
  '7b9': ['dominant-7-b9', '7b9'],
  '7#9': ['dominant-7-sharp9', '7#9'],
  11: ['dominant-11', '11'],
  13: ['dominant-13', '13'],
  maj7: ['major-7', 'maj7'],
  maj9: ['major-9', 'maj9'],
  maj11: ['major-11', 'maj11'],
  maj13: ['major-13', 'maj13'],
  m6: ['minor-6', 'm6'],
  m7: ['minor-7', 'm7'],
  m7b5: ['half-diminished', 'm7b5'],
  m9: ['minor-9', 'm9'],
  m11: ['minor-11', 'm11'],
  mmaj7: ['minor-major-7', 'mMaj7'],
  add9: ['add9', 'add9'],
};

// Root spelling matching the app's convention (D♭ E♭ A♭ B♭ flat; F♯ sharp).
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const FLAT_ROOTS = new Set([1, 3, 5, 8, 10]);
const rootName = (pc) => (FLAT_ROOTS.has(pc) ? FLAT_NAMES : SHARP_NAMES)[pc];

// The ChordShape colour/filter tag from a quality key.
function shapeQuality(quality) {
  if (quality.startsWith('minor') || quality === 'diminished' || quality === 'half-diminished')
    return 'minor';
  if (quality.startsWith('dominant') || quality === 'augmented-7') return 'dominant';
  if (quality === 'major' || quality === 'sixth' || quality === 'major-7') return 'major';
  return 'barre';
}

const MAX_POSITIONS = 5; // keep a handful of positions per chord; drop the highest, rarest ones.

// Absolute fret from a chords-db (fret, baseFret): open (0) and muted (-1) pass through; fretted notes
// are offset by the position's window.
const absFret = (fret, baseFret) => (fret > 0 ? fret + baseFret - 1 : fret);

function convert(db, strings) {
  /** @type {Record<string, object[]>} */
  const out = {};
  let kept = 0;
  let skipped = 0;
  for (const rootKey of Object.keys(db.chords)) {
    for (const entry of db.chords[rootKey]) {
      const mapped = SUFFIX_MAP[entry.suffix];
      if (!mapped) continue;
      const [quality, symbol] = mapped;
      const pc = KEY_TO_PC[entry.key];
      if (pc == null) continue;
      const mapKey = `${pc}:${quality}`;
      if (!out[mapKey]) out[mapKey] = [];
      const shapes = out[mapKey];
      for (const pos of entry.positions.slice(0, MAX_POSITIONS)) {
        if (!Array.isArray(pos.frets) || pos.frets.length !== strings) {
          skipped += 1;
          continue;
        }
        const base = pos.baseFret ?? 1;
        const frets = pos.frets.map((f) => absFret(f, base));
        const shape = { name: `${rootName(pc)}${symbol}`, quality: shapeQuality(quality), frets };
        if (base > 1) shape.baseFret = base;
        if (Array.isArray(pos.fingers) && pos.fingers.some((f) => f > 0))
          shape.fingers = pos.fingers;
        if (Array.isArray(pos.barres) && pos.barres.length > 0) {
          shape.barres = pos.barres.map((b) => absFret(b, base));
        }
        shapes.push(shape);
        kept += 1;
      }
    }
  }
  return { out, kept, skipped };
}

function serialize(map) {
  const keys = Object.keys(map).sort((a, b) => {
    const [pa, qa] = a.split(':');
    const [pb, qb] = b.split(':');
    return Number(pa) - Number(pb) || qa.localeCompare(qb);
  });
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])},`);
  return `{\n${lines.join('\n')}\n}`;
}

const guitar = convert(guitarDb, guitarDb.main.strings);
const ukulele = convert(ukuleleDb, ukuleleDb.main.strings);

const header = `// GENERATED FILE — do not edit by hand.
// Source: @tombatossals/chords-db (MIT, https://github.com/tombatossals/chords-db).
// Regenerate with: pnpm --filter @TheY2T/tmr-music-core chords:import
//
// Fretted chord voicings keyed by "\${pitchClass}:\${qualityKey}". Frets are absolute (0 = open,
// -1 = muted); \`fingers\` (0 = open/none, 1–4) and \`barres\` (absolute frets) are included when present.

import type { ChordShape } from './chord-shapes';

export const IMPORTED_GUITAR_VOICINGS: Record<string, ChordShape[]> = ${serialize(guitar.out)};

export const IMPORTED_UKULELE_VOICINGS: Record<string, ChordShape[]> = ${serialize(ukulele.out)};
`;

const outPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/chord-voicings.generated.ts',
);
writeFileSync(outPath, header);
console.log(
  `Wrote ${outPath}\n  guitar: ${guitar.kept} voicings (${Object.keys(guitar.out).length} chords), ${guitar.skipped} skipped` +
    `\n  ukulele: ${ukulele.kept} voicings (${Object.keys(ukulele.out).length} chords), ${ukulele.skipped} skipped`,
);
