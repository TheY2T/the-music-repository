// Generative movable chord-shape library. Given a chord root + quality + instrument, produce playable
// fretted voicings anywhere on the neck by sliding movable shape templates (E-shape / A-shape barres on
// guitar, barre shapes on ukulele, root grips on bass). This replaces the small static open-position
// tables (GUITAR_CHORDS/UKULELE_CHORDS) for programmatic use — every root in every key, plus 7th/6th/
// extended qualities and bass shapes that the static tables never covered.
//
// Frets are ABSOLUTE (0 = open, -1 = muted, N = fret N) so the app's audio strum can sound them directly
// (tuning[i] + frets[i]); `baseFret` only affects how the diagram windows the neck.

import type { ChordShape } from './chord-diagram';

export type Instrument = 'guitar' | 'bass' | 'ukulele';

/** Low-string-first open-string MIDI for a 4-string bass (E1 A1 D2 G2). */
export const BASS_TUNING_LOW_FIRST = [28, 33, 38, 43];

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
// Flat-spelled roots, matching the app's convention (D♭ E♭ A♭ B♭; F♯ stays sharp).
const FLAT_ROOTS = new Set([1, 3, 5, 8, 10]);

function rootName(pc: number): string {
  const i = ((pc % 12) + 12) % 12;
  return (FLAT_ROOTS.has(i) ? FLAT_NAMES : SHARP_NAMES)[i] ?? '';
}

/**
 * A movable shape: fret offsets relative to a barre, plus the chord root's pitch class when the barre
 * sits at fret 0 (`refRootPc`). Sliding the barre to fret N adds N to every offset, transposing the
 * whole shape while preserving the quality. `null` = muted string; the lowest offset is 0 (the barre).
 */
interface MovableTemplate {
  /** Display label for the shape family (e.g. "E-shape", "A-shape"). */
  family: string;
  /** Chord-root pitch class produced when the barre is at fret 0. */
  refRootPc: number;
  /** Relative fret per string, low-string-first. */
  offsets: (number | null)[];
}

// Suffix appended to the root for the generated shape's display name, keyed by chord-quality.
const QUALITY_SUFFIX: Record<string, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  sixth: '6',
  'minor-6': 'm6',
  'major-7': 'maj7',
  'minor-7': 'm7',
  'dominant-7': '7',
  'half-diminished': 'm7♭5',
  add9: 'add9',
  'dominant-9': '9',
};

// Which ChordShape `quality` tag (used only for the tool's colour/filter chips) a chord-quality maps to.
function shapeQuality(quality: string): ChordShape['quality'] {
  if (quality === 'minor' || quality.startsWith('minor')) return 'minor';
  if (quality === 'dominant-7' || quality === 'dominant-9') return 'dominant';
  if (quality === 'major' || quality === 'sixth' || quality === 'major-7') return 'major';
  return 'barre';
}

// Guitar movable shapes. The five CAGED families (C/A/G/E/D) are provided for the qualities they voice
// cleanly (all five for major and the dominant/major-7 chords; the practical subset for minor and
// minor-7 — the C/G-shape minor grips are awkward and omitted). Every offset table is verified so all
// sounded strings are chord tones and the root stays in the bass across all 12 roots (chord-library.test).
const GUITAR_TEMPLATES: Record<string, MovableTemplate[]> = {
  major: [
    { family: 'C-shape', refRootPc: 0, offsets: [null, 3, 2, 0, 1, 0] },
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 2, 2, 0] },
    { family: 'G-shape', refRootPc: 7, offsets: [3, 2, 0, 0, 0, 3] },
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 2, 1, 0, 0] },
    { family: 'D-shape', refRootPc: 2, offsets: [null, null, 0, 2, 3, 2] },
  ],
  minor: [
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 2, 1, 0] },
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 2, 0, 0, 0] },
    { family: 'D-shape', refRootPc: 2, offsets: [null, null, 0, 2, 3, 1] },
  ],
  'dominant-7': [
    { family: 'C-shape', refRootPc: 0, offsets: [null, 3, 2, 3, 1, 0] },
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 0, 2, 0] },
    { family: 'G-shape', refRootPc: 7, offsets: [3, 2, 0, 0, 0, 1] },
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 0, 1, 0, 0] },
    { family: 'D-shape', refRootPc: 2, offsets: [null, null, 0, 2, 1, 2] },
  ],
  'major-7': [
    { family: 'C-shape', refRootPc: 0, offsets: [null, 3, 2, 0, 0, 0] },
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 1, 2, 0] },
    { family: 'G-shape', refRootPc: 7, offsets: [3, 2, 0, 0, 0, 2] },
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 1, 1, 0, 0] },
    { family: 'D-shape', refRootPc: 2, offsets: [null, null, 0, 2, 2, 2] },
  ],
  'minor-7': [
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 0, 1, 0] },
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 0, 0, 0, 0] },
    { family: 'D-shape', refRootPc: 2, offsets: [null, null, 0, 2, 1, 1] },
  ],
  'half-diminished': [
    { family: 'E-shape', refRootPc: 4, offsets: [0, 1, 0, 0, null, null] },
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 1, 0, 1, null] },
  ],
  sixth: [
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 2, 1, 2, 0] },
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 2, 2, 2] },
  ],
  'minor-6': [
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 2, 0, 2, 0] },
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 2, 1, 2] },
  ],
  sus4: [
    { family: 'E-shape', refRootPc: 4, offsets: [0, 2, 2, 2, 0, 0] },
    { family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 2, 3, 0] },
  ],
  sus2: [{ family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 2, 0, 0] }],
  add9: [{ family: 'A-shape', refRootPc: 9, offsets: [null, 0, 2, 4, 2, 0] }],
  'dominant-9': [{ family: 'E-shape', refRootPc: 4, offsets: [0, 2, 0, 1, 0, 2] }],
  diminished: [{ family: 'E-shape', refRootPc: 4, offsets: [0, 1, 2, 0, null, null] }],
  augmented: [{ family: 'E-shape', refRootPc: 4, offsets: [0, 3, 2, 1, 1, 0] }],
};

// Ukulele movable barre shapes (g-C-E-A), one workhorse family per quality (root reference = A, pc 9).
const UKULELE_TEMPLATES: Record<string, MovableTemplate[]> = {
  major: [{ family: 'A-barre', refRootPc: 9, offsets: [2, 1, 0, 0] }],
  minor: [{ family: 'A-barre', refRootPc: 9, offsets: [2, 0, 0, 0] }],
  'dominant-7': [{ family: 'A-barre', refRootPc: 9, offsets: [0, 1, 0, 0] }],
  'major-7': [{ family: 'A-barre', refRootPc: 9, offsets: [1, 1, 0, 0] }],
  'minor-7': [{ family: 'A-barre', refRootPc: 9, offsets: [0, 0, 0, 0] }],
};

// Bass root grips (root-on-low-E and root-on-A families). Quality-neutral — bass lines are built from
// the root, 5th and octave rather than full chords, so these apply to every quality.
const BASS_TEMPLATES: MovableTemplate[] = [
  { family: 'Root + 5th', refRootPc: 4, offsets: [0, 2, null, null] },
  { family: 'Root · 5th · octave', refRootPc: 4, offsets: [0, 2, 2, null] },
  { family: 'Root + 5th (A string)', refRootPc: 9, offsets: [null, 0, 2, null] },
];

function templatesFor(instrument: Instrument, quality: string): MovableTemplate[] {
  if (instrument === 'bass') return BASS_TEMPLATES;
  if (instrument === 'ukulele') return UKULELE_TEMPLATES[quality] ?? [];
  return GUITAR_TEMPLATES[quality] ?? [];
}

export interface GenerateOptions {
  /** Highest fret a shape may reach; shapes above it are dropped. Default 15. */
  maxFret?: number;
  /** Override the generated display name (default: root name + quality suffix). */
  name?: string;
}

/**
 * Realise one template for a chord root as an absolute-fret `ChordShape` with a display `baseFret`,
 * or null if the shape would run past `maxFret`.
 */
function realize(
  rootPc: number,
  quality: string,
  tpl: MovableTemplate,
  name: string,
  maxFret: number,
): (ChordShape & { baseFret: number; family: string }) | null {
  const barre = (((rootPc - tpl.refRootPc) % 12) + 12) % 12;
  const frets = tpl.offsets.map((o) => (o == null ? -1 : barre + o));
  const fretted = frets.filter((f) => f > 0);
  if (fretted.length > 0 && Math.max(...fretted) > maxFret) return null;
  const minFretted = fretted.length > 0 ? Math.min(...fretted) : 0;
  const baseFret = minFretted > 1 ? minFretted : 1;
  return { name, quality: shapeQuality(quality), frets, baseFret, family: tpl.family };
}

/**
 * Generate movable voicings for a chord. Returns the shapes low-position-first; empty when the
 * instrument has no template for the quality (e.g. an extended jazz chord on ukulele) — callers should
 * treat an empty result as "no diagram available" and degrade gracefully.
 */
export function generateChordShapes(
  rootPc: number,
  quality: string,
  instrument: Instrument = 'guitar',
  opts: GenerateOptions = {},
): (ChordShape & { baseFret: number; family: string })[] {
  const maxFret = opts.maxFret ?? 15;
  const name = opts.name ?? `${rootName(rootPc)}${QUALITY_SUFFIX[quality] ?? ''}`;
  const shapes = templatesFor(instrument, quality)
    .map((tpl) => realize(rootPc, quality, tpl, name, maxFret))
    .filter((s): s is ChordShape & { baseFret: number; family: string } => s != null);
  return shapes.sort((a, b) => a.baseFret - b.baseFret);
}

/** The chord qualities this library can render for an instrument (for building level-aware pickers). */
export function supportedQualities(instrument: Instrument = 'guitar'): string[] {
  if (instrument === 'bass') return Object.keys(QUALITY_SUFFIX);
  if (instrument === 'ukulele') return Object.keys(UKULELE_TEMPLATES);
  return Object.keys(GUITAR_TEMPLATES);
}

/** The CAGED shape families, in the order they are taught (C → A → G → E → D). */
export const CAGED_FAMILIES = ['C-shape', 'A-shape', 'G-shape', 'E-shape', 'D-shape'];

/**
 * Guitar chord voicings ordered by the CAGED sequence (C-A-G-E-D) for the CAGED explorer. Qualities
 * that only voice cleanly in some families (minor, minor-7) simply return fewer shapes.
 */
export function generateCagedShapes(
  rootPc: number,
  quality: string,
  opts: GenerateOptions = {},
): (ChordShape & { baseFret: number; family: string })[] {
  return generateChordShapes(rootPc, quality, 'guitar', opts).sort(
    (a, b) => CAGED_FAMILIES.indexOf(a.family) - CAGED_FAMILIES.indexOf(b.family),
  );
}
