/** Pure music-theory helpers for the interactive tools (12-TET, no dependencies). */

export const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

/** Pitch class (0–11) → note name. */
export function pitchName(pitchClass: number, flats = false): string {
  const names = flats ? FLAT_NAMES : SHARP_NAMES;
  return names[((pitchClass % 12) + 12) % 12];
}

/** MIDI note number → frequency in Hz (A4 = 69 = 440 Hz). */
export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Difficulty tier for a scale or chord, used to progressively disclose options per learner level
 * (Beginner → Expert). Tools filter their pickers with `scalesByLevel` / `chordsByLevel`; a tool that
 * ignores the field simply shows everything.
 */
export type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** Level order, low → high; a learner at level N sees everything up to and including N. */
export const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced', 'expert'];

/** True when `level` is at or below `maxLevel` in the `LEVELS` order. */
export function isWithinLevel(level: Level, maxLevel: Level): boolean {
  return LEVELS.indexOf(level) <= LEVELS.indexOf(maxLevel);
}

export interface ScaleDefinition {
  key: string;
  name: string;
  /** Semitone offsets from the root. */
  intervals: number[];
  /** Difficulty tier for level-based disclosure. */
  level: Level;
}

export const SCALES: ScaleDefinition[] = [
  { key: 'major', name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11], level: 'beginner' },
  {
    key: 'natural-minor',
    name: 'Natural minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    level: 'beginner',
  },
  {
    key: 'major-pentatonic',
    name: 'Major pentatonic',
    intervals: [0, 2, 4, 7, 9],
    level: 'beginner',
  },
  {
    key: 'minor-pentatonic',
    name: 'Minor pentatonic',
    intervals: [0, 3, 5, 7, 10],
    level: 'beginner',
  },
  { key: 'blues', name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], level: 'beginner' },
  {
    key: 'chromatic',
    name: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    level: 'beginner',
  },
  {
    key: 'harmonic-minor',
    name: 'Harmonic minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    level: 'intermediate',
  },
  {
    key: 'melodic-minor',
    name: 'Melodic minor (jazz)',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    level: 'intermediate',
  },
  { key: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], level: 'intermediate' },
  { key: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], level: 'intermediate' },
  { key: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], level: 'intermediate' },
  {
    key: 'mixolydian',
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    level: 'intermediate',
  },
  { key: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], level: 'advanced' },
  {
    key: 'whole-tone',
    name: 'Whole tone',
    intervals: [0, 2, 4, 6, 8, 10],
    level: 'advanced',
  },
  {
    key: 'diminished-hw',
    name: 'Diminished (half–whole)',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    level: 'advanced',
  },
  {
    key: 'diminished-wh',
    name: 'Diminished (whole–half)',
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    level: 'advanced',
  },
  {
    key: 'bebop-dominant',
    name: 'Bebop dominant',
    intervals: [0, 2, 4, 5, 7, 9, 10, 11],
    level: 'advanced',
  },
  {
    key: 'bebop-major',
    name: 'Bebop major',
    intervals: [0, 2, 4, 5, 7, 8, 9, 11],
    level: 'advanced',
  },
  {
    key: 'phrygian-dominant',
    name: 'Phrygian dominant (Spanish)',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    level: 'advanced',
  },
  {
    key: 'hungarian-minor',
    name: 'Hungarian minor',
    intervals: [0, 2, 3, 6, 7, 8, 11],
    level: 'expert',
  },
];

/** Scales available at or below `maxLevel` (see `Level`). */
export function scalesByLevel(maxLevel: Level): ScaleDefinition[] {
  return SCALES.filter((s) => isWithinLevel(s.level, maxLevel));
}

/**
 * Scales (built on `rootPc`) that contain every tone of a chord — i.e. safe scales to improvise with
 * over that chord. Chromatic is excluded (it trivially contains everything). Used by the improvisation
 * guide; pair with `scalesByLevel` to disclose progressively.
 */
export function scalesForChord(rootPc: number, chordIntervals: number[]): ScaleDefinition[] {
  const chordPcs = chordIntervals.map((i) => (((rootPc + i) % 12) + 12) % 12);
  return SCALES.filter((scale) => {
    if (scale.key === 'chromatic') return false;
    const scalePcs = scalePitchClasses(rootPc, scale.intervals);
    return chordPcs.every((pc) => scalePcs.has(pc));
  });
}

/** The pitch classes (0–11) of a scale built on `rootPitchClass`. */
export function scalePitchClasses(rootPitchClass: number, intervals: number[]): Set<number> {
  return new Set(intervals.map((interval) => (rootPitchClass + interval) % 12));
}

export const ROOT_CHOICES = Array.from({ length: 12 }, (_, pc) => pc);

// --- Circle of fifths ---

export interface CircleEntry {
  /** Major-key pitch class. */
  pitchClass: number;
  major: string;
  relativeMinor: string;
  /** Signature: positive = sharps, negative = flats. */
  accidentals: number;
}

/** Clockwise from C: C G D A E B F♯ D♭ A♭ E♭ B♭ F. */
export const CIRCLE_OF_FIFTHS: CircleEntry[] = [
  { pitchClass: 0, major: 'C', relativeMinor: 'Am', accidentals: 0 },
  { pitchClass: 7, major: 'G', relativeMinor: 'Em', accidentals: 1 },
  { pitchClass: 2, major: 'D', relativeMinor: 'Bm', accidentals: 2 },
  { pitchClass: 9, major: 'A', relativeMinor: 'F♯m', accidentals: 3 },
  { pitchClass: 4, major: 'E', relativeMinor: 'C♯m', accidentals: 4 },
  { pitchClass: 11, major: 'B', relativeMinor: 'G♯m', accidentals: 5 },
  { pitchClass: 6, major: 'G♭', relativeMinor: 'E♭m', accidentals: -6 },
  { pitchClass: 1, major: 'D♭', relativeMinor: 'B♭m', accidentals: -5 },
  { pitchClass: 8, major: 'A♭', relativeMinor: 'Fm', accidentals: -4 },
  { pitchClass: 3, major: 'E♭', relativeMinor: 'Cm', accidentals: -3 },
  { pitchClass: 10, major: 'B♭', relativeMinor: 'Gm', accidentals: -2 },
  { pitchClass: 5, major: 'F', relativeMinor: 'Dm', accidentals: -1 },
];

const MAJOR_ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const MAJOR_QUALITY = ['', 'm', 'm', '', '', 'm', '°'];
const TRIAD_INTERVALS: Record<string, number[]> = { '': [0, 4, 7], m: [0, 3, 7], '°': [0, 3, 6] };

export interface DiatonicChord {
  roman: string;
  name: string;
  /** Triad pitch classes (0–11), for playback. */
  pitchClasses: number[];
}

/** The seven diatonic triads of the major key on `rootPitchClass`. */
export function diatonicChords(rootPitchClass: number, flats: boolean): DiatonicChord[] {
  const majorScale = [0, 2, 4, 5, 7, 9, 11];
  return majorScale.map((interval, degree) => {
    const quality = MAJOR_QUALITY[degree];
    const chordRoot = (rootPitchClass + interval) % 12;
    return {
      roman: MAJOR_ROMAN[degree],
      name: `${pitchName(chordRoot, flats)}${quality}`,
      pitchClasses: TRIAD_INTERVALS[quality].map((i) => (chordRoot + i) % 12),
    };
  });
}

const MINOR_ROMAN = ['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII'];
const MINOR_QUALITY = ['m', '°', '', 'm', 'm', '', ''];

/** The seven diatonic triads of the natural-minor key on `rootPitchClass`. */
export function diatonicChordsMinor(rootPitchClass: number, flats: boolean): DiatonicChord[] {
  const minorScale = [0, 2, 3, 5, 7, 8, 10];
  return minorScale.map((interval, degree) => {
    const quality = MINOR_QUALITY[degree];
    const chordRoot = (rootPitchClass + interval) % 12;
    return {
      roman: MINOR_ROMAN[degree],
      name: `${pitchName(chordRoot, flats)}${quality}`,
      pitchClasses: TRIAD_INTERVALS[quality].map((i) => (chordRoot + i) % 12),
    };
  });
}

/** Describe a signature: `2 sharps`, `3 flats`, or `no sharps or flats`. */
export function describeAccidentals(accidentals: number): string {
  if (accidentals === 0) {
    return 'no sharps or flats';
  }
  const count = Math.abs(accidentals);
  const kind = accidentals > 0 ? 'sharp' : 'flat';
  return `${count} ${kind}${count === 1 ? '' : 's'}`;
}

// --- Guitar fretboard ---

/** Standard tuning, high string first: E4 B3 G3 D3 A2 E2 (MIDI). */
export const STANDARD_TUNING = [64, 59, 55, 50, 45, 40];
export const STANDARD_TUNING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E'];

/** Frets that carry an inlay marker on a standard fretboard. */
export const FRET_MARKERS = new Set([3, 5, 7, 9, 12, 15]);

// --- Chords ---

export interface ChordDefinition {
  key: string;
  name: string;
  /** Semitone offsets from the root (may exceed 12 for extended tones, e.g. 14 = 9th). */
  intervals: number[];
  /**
   * Canonical chord-symbol suffix (appended to the root, e.g. `m7`, `maj7`, `` for a bare major).
   * The single source of truth for `parseChordSymbol` in `embeds.ts`.
   */
  symbol: string;
  /** Alternate suffixes that also resolve to this chord (e.g. `M7`, `Δ` for a major 7th). */
  aliases?: string[];
  /** Difficulty tier for level-based disclosure. */
  level: Level;
}

export const CHORDS: ChordDefinition[] = [
  {
    key: 'major',
    name: 'Major',
    intervals: [0, 4, 7],
    symbol: '',
    aliases: ['maj'],
    level: 'beginner',
  },
  {
    key: 'minor',
    name: 'Minor',
    intervals: [0, 3, 7],
    symbol: 'm',
    aliases: ['min'],
    level: 'beginner',
  },
  {
    key: 'diminished',
    name: 'Diminished',
    intervals: [0, 3, 6],
    symbol: 'dim',
    aliases: ['°'],
    level: 'intermediate',
  },
  {
    key: 'augmented',
    name: 'Augmented',
    intervals: [0, 4, 8],
    symbol: 'aug',
    aliases: ['+'],
    level: 'intermediate',
  },
  {
    key: 'sus2',
    name: 'Suspended 2nd',
    intervals: [0, 2, 7],
    symbol: 'sus2',
    level: 'intermediate',
  },
  {
    key: 'sus4',
    name: 'Suspended 4th',
    intervals: [0, 5, 7],
    symbol: 'sus4',
    level: 'intermediate',
  },
  { key: 'sixth', name: 'Major 6th', intervals: [0, 4, 7, 9], symbol: '6', level: 'intermediate' },
  {
    key: 'minor-6',
    name: 'Minor 6th',
    intervals: [0, 3, 7, 9],
    symbol: 'm6',
    level: 'intermediate',
  },
  {
    key: 'major-7',
    name: 'Major 7th',
    intervals: [0, 4, 7, 11],
    symbol: 'maj7',
    aliases: ['M7', 'Δ7', 'Δ'],
    level: 'intermediate',
  },
  {
    key: 'minor-7',
    name: 'Minor 7th',
    intervals: [0, 3, 7, 10],
    symbol: 'm7',
    aliases: ['min7'],
    level: 'intermediate',
  },
  {
    key: 'dominant-7',
    name: 'Dominant 7th',
    intervals: [0, 4, 7, 10],
    symbol: '7',
    level: 'intermediate',
  },
  {
    key: 'dominant-7-sus4',
    name: 'Dominant 7th sus4',
    intervals: [0, 5, 7, 10],
    symbol: '7sus4',
    level: 'intermediate',
  },
  {
    key: 'diminished-7',
    name: 'Diminished 7th',
    intervals: [0, 3, 6, 9],
    symbol: 'dim7',
    aliases: ['°7'],
    level: 'intermediate',
  },
  { key: 'add9', name: 'Add 9', intervals: [0, 4, 7, 14], symbol: 'add9', level: 'intermediate' },
  {
    key: 'half-diminished',
    name: 'Half-diminished (m7♭5)',
    intervals: [0, 3, 6, 10],
    symbol: 'm7b5',
    aliases: ['ø7', 'ø'],
    level: 'advanced',
  },
  {
    key: 'minor-major-7',
    name: 'Minor-major 7th',
    intervals: [0, 3, 7, 11],
    symbol: 'mMaj7',
    aliases: ['mM7'],
    level: 'advanced',
  },
  {
    key: 'augmented-7',
    name: 'Augmented 7th',
    intervals: [0, 4, 8, 10],
    symbol: '7#5',
    aliases: ['+7', 'aug7'],
    level: 'advanced',
  },
  {
    key: 'dominant-9',
    name: 'Dominant 9th',
    intervals: [0, 4, 7, 10, 14],
    symbol: '9',
    level: 'advanced',
  },
  {
    key: 'major-9',
    name: 'Major 9th',
    intervals: [0, 4, 7, 11, 14],
    symbol: 'maj9',
    aliases: ['M9'],
    level: 'advanced',
  },
  {
    key: 'minor-9',
    name: 'Minor 9th',
    intervals: [0, 3, 7, 10, 14],
    symbol: 'm9',
    aliases: ['min9'],
    level: 'advanced',
  },
  {
    key: 'dominant-11',
    name: 'Dominant 11th',
    intervals: [0, 7, 10, 14, 17],
    symbol: '11',
    level: 'expert',
  },
  {
    key: 'dominant-13',
    name: 'Dominant 13th',
    intervals: [0, 4, 10, 14, 21],
    symbol: '13',
    level: 'expert',
  },
  {
    key: 'dominant-7-b9',
    name: 'Dominant 7♭9',
    intervals: [0, 4, 7, 10, 13],
    symbol: '7b9',
    level: 'expert',
  },
  {
    key: 'dominant-7-sharp9',
    name: 'Dominant 7♯9',
    intervals: [0, 4, 7, 10, 15],
    symbol: '7#9',
    level: 'expert',
  },
  {
    key: 'dominant-7-sharp11',
    name: 'Dominant 7♯11',
    intervals: [0, 4, 7, 10, 18],
    symbol: '7#11',
    level: 'expert',
  },
  {
    key: 'dominant-7-b13',
    name: 'Dominant 7♭13',
    intervals: [0, 4, 7, 10, 20],
    symbol: '7b13',
    level: 'expert',
  },
];

/** Chords available at or below `maxLevel` (see `Level`). */
export function chordsByLevel(maxLevel: Level): ChordDefinition[] {
  return CHORDS.filter((c) => isWithinLevel(c.level, maxLevel));
}

const INTERVAL_LABELS = ['R', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♯5', '6', '♭7', '7'];
// Compound (above-the-octave) tensions, so extended chords read as 9/11/13, not 2/4/6.
const COMPOUND_LABELS: Record<number, string> = {
  13: '♭9',
  14: '9',
  15: '♯9',
  17: '11',
  18: '♯11',
  20: '♭13',
  21: '13',
};

/** Scale-degree label for a semitone offset (0 = root); compound offsets read as 9/11/13. */
export function intervalLabel(semitones: number): string {
  return COMPOUND_LABELS[semitones] ?? INTERVAL_LABELS[((semitones % 12) + 12) % 12];
}

// --- Functional / Roman-numeral analysis ---

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
// Semitone-from-tonic → scale degree number + accidental (major-key spelling).
const DEGREE_BY_SEMITONE: { num: number; accidental: '' | '♭' | '♯' }[] = [
  { num: 1, accidental: '' },
  { num: 2, accidental: '♭' },
  { num: 2, accidental: '' },
  { num: 3, accidental: '♭' },
  { num: 3, accidental: '' },
  { num: 4, accidental: '' },
  { num: 5, accidental: '♭' },
  { num: 5, accidental: '' },
  { num: 6, accidental: '♭' },
  { num: 6, accidental: '' },
  { num: 7, accidental: '♭' },
  { num: 7, accidental: '' },
];
// Diatonic triad quality of each major-scale degree.
const MAJOR_KEY_QUALITIES = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
const FUNCTION_BY_DEGREE = [
  'Tonic',
  'Predominant',
  'Tonic',
  'Predominant',
  'Dominant',
  'Tonic',
  'Dominant',
];
// Roman-numeral suffix per chord quality key.
const ROMAN_SUFFIX: Record<string, string> = {
  major: '',
  minor: '',
  diminished: '°',
  augmented: '+',
  sus2: 'sus2',
  sus4: 'sus4',
  sixth: '6',
  'minor-6': '6',
  'major-7': 'maj7',
  'minor-7': '7',
  'dominant-7': '7',
  'dominant-7-sus4': '7sus4',
  'diminished-7': '°7',
  add9: 'add9',
  'half-diminished': 'ø7',
  'minor-major-7': 'maj7',
  'augmented-7': '+7',
  'dominant-9': '9',
  'major-9': 'maj9',
  'minor-9': '9',
  'dominant-11': '11',
  'dominant-13': '13',
  'dominant-7-b9': '7♭9',
  'dominant-7-sharp9': '7♯9',
  'dominant-7-sharp11': '7♯11',
  'dominant-7-b13': '7♭13',
};
const LOWERCASE_QUALITIES = new Set([
  'minor',
  'diminished',
  'minor-7',
  'diminished-7',
  'minor-6',
  'half-diminished',
  'minor-major-7',
  'minor-9',
]);

export interface ChordAnalysis {
  roman: string;
  /** Harmonic function: Tonic / Predominant / Dominant. */
  role: string;
  diatonic: boolean;
}

/** Analyse a chord's Roman numeral + function within a major key. */
export function analyzeChordInKey(
  keyRoot: number,
  chordRoot: number,
  chordKey: string,
): ChordAnalysis {
  const semis = (((chordRoot - keyRoot) % 12) + 12) % 12;
  const { num, accidental } = DEGREE_BY_SEMITONE[semis];
  const base = ROMAN_NUMERALS[num - 1];
  const numeral = LOWERCASE_QUALITIES.has(chordKey) ? base.toLowerCase() : base;
  const roman = `${accidental}${numeral}${ROMAN_SUFFIX[chordKey] ?? ''}`;

  const baseQuality = chordKey.startsWith('minor')
    ? 'minor'
    : chordKey.startsWith('diminished')
      ? 'diminished'
      : chordKey === 'augmented'
        ? 'augmented'
        : 'major';
  const diatonic = accidental === '' && baseQuality === MAJOR_KEY_QUALITIES[num - 1];
  return { roman, role: FUNCTION_BY_DEGREE[num - 1], diatonic };
}

// Easy open-chord keys on guitar (CAGED tonics): C, A, G, E, D.
const OPEN_SHAPE_KEYS = [0, 9, 7, 4, 2];

export interface CapoSuggestion {
  fret: number;
  shapeKey: number;
}

/** Capo positions (fret 0–7) that let a song in `tonicPc` be played with open-chord shapes. */
export function capoSuggestions(tonicPc: number): CapoSuggestion[] {
  const seen = new Set<number>();
  const out: CapoSuggestion[] = [];
  for (const shapeKey of OPEN_SHAPE_KEYS) {
    const fret = (((tonicPc - shapeKey) % 12) + 12) % 12;
    if (fret <= 7 && !seen.has(fret)) {
      seen.add(fret);
      out.push({ fret, shapeKey });
    }
  }
  return out.sort((a, b) => a.fret - b.fret);
}

export interface ReharmSuggestion {
  /** Short name of the substitution technique. */
  label: string;
  /** One-line reason it works. */
  description: string;
  /** Pitch class of the suggested chord's root. */
  root: number;
  /** Chord-quality key (see `CHORDS`). */
  quality: string;
}

/**
 * Common reharmonization moves for a chord in a major key — tritone subs for
 * dominants, relative major/minor swaps, a secondary dominant approach, and
 * parallel-minor modal interchange. Pure theory; the caller decides how to apply.
 */
export function reharmonizations(
  keyRoot: number,
  chordRoot: number,
  chordKey: string,
): ReharmSuggestion[] {
  const out: ReharmSuggestion[] = [];
  const degree = (((chordRoot - keyRoot) % 12) + 12) % 12;
  const isDominant = chordKey === 'dominant-7' || (chordKey === 'major' && degree === 7);
  const isMajorish = chordKey === 'major' || chordKey === 'major-7';
  const isMinorish = chordKey === 'minor' || chordKey === 'minor-7';

  if (isDominant) {
    out.push({
      label: 'Tritone sub',
      description: 'Dominant 7th a tritone away — shares the 3rd & 7th',
      root: (chordRoot + 6) % 12,
      quality: 'dominant-7',
    });
  }
  if (isMajorish) {
    out.push({
      label: 'Relative minor',
      description: 'Minor 7th a 3rd below — two shared tones, darker colour',
      root: (chordRoot + 9) % 12,
      quality: 'minor-7',
    });
  }
  if (isMinorish) {
    out.push({
      label: 'Relative major',
      description: 'Major 7th a minor-3rd up — two shared tones, brighter',
      root: (chordRoot + 3) % 12,
      quality: 'major-7',
    });
  }
  out.push({
    label: 'Secondary dominant',
    description: 'V7 of this chord — approach it from its own dominant',
    root: (chordRoot + 7) % 12,
    quality: 'dominant-7',
  });
  if (chordKey === 'major') {
    out.push({
      label: 'Modal interchange',
      description: 'Borrow the parallel-minor version of this chord',
      root: chordRoot,
      quality: 'minor',
    });
  }
  return out;
}

/** Full interval names for 0–12 semitones. */
export const INTERVAL_NAMES = [
  'Perfect unison',
  'Minor 2nd',
  'Major 2nd',
  'Minor 3rd',
  'Major 3rd',
  'Perfect 4th',
  'Tritone',
  'Perfect 5th',
  'Minor 6th',
  'Major 6th',
  'Minor 7th',
  'Major 7th',
  'Perfect octave',
];

// --- Staff notation (treble clef) ---

export interface StaffNote {
  name: string;
  midi: number;
  /** Diatonic step above the bottom staff line (E4 = 0); a line every even step. */
  step: number;
}

const LETTER_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const NATURALS: { letter: string; semitone: number }[] = [
  { letter: 'C', semitone: 0 },
  { letter: 'D', semitone: 2 },
  { letter: 'E', semitone: 4 },
  { letter: 'F', semitone: 5 },
  { letter: 'G', semitone: 7 },
  { letter: 'A', semitone: 9 },
  { letter: 'B', semitone: 11 },
];
const E4_DIATONIC = LETTER_INDEX.E + 4 * 7;

/** Natural notes C4…C6 for a treble staff, with their vertical staff step. */
export function trebleStaffNotes(): StaffNote[] {
  const notes: StaffNote[] = [];
  for (let octave = 4; octave <= 5; octave += 1) {
    for (const natural of NATURALS) {
      notes.push({
        name: `${natural.letter}${octave}`,
        midi: 12 * (octave + 1) + natural.semitone,
        step: LETTER_INDEX[natural.letter] + octave * 7 - E4_DIATONIC,
      });
    }
  }
  notes.push({ name: 'C6', midi: 84, step: LETTER_INDEX.C + 6 * 7 - E4_DIATONIC });
  return notes;
}

// Bass staff: the bottom line is G2 (step 0); lines run G2 B2 D3 F3 A3.
const G2_DIATONIC = LETTER_INDEX.G + 2 * 7;

/** Natural notes C2…C4 for a bass staff, with their vertical staff step (bottom line G2 = step 0). */
export function bassStaffNotes(): StaffNote[] {
  const notes: StaffNote[] = [];
  for (let octave = 2; octave <= 3; octave += 1) {
    for (const natural of NATURALS) {
      notes.push({
        name: `${natural.letter}${octave}`,
        midi: 12 * (octave + 1) + natural.semitone,
        step: LETTER_INDEX[natural.letter] + octave * 7 - G2_DIATONIC,
      });
    }
  }
  notes.push({ name: 'C4', midi: 60, step: LETTER_INDEX.C + 4 * 7 - G2_DIATONIC });
  return notes;
}

export interface StaffPlacement {
  /** Vertical staff step (E4 = 0); the accidental does not change the step. */
  step: number;
  /** Full note name for labels, e.g. "F♯4". */
  label: string;
  /** Accidental glyph to draw left of the note head, or '' for a natural. */
  accidental: '' | '♯' | '♭';
}

/** Where a MIDI note sits on the treble staff, spelled with sharps or flats. */
export function staffPlacement(midi: number, flats = false): StaffPlacement {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = pitchName(pitchClass, flats);
  const letter = name[0];
  const accidental = (name.length > 1 ? name[1] : '') as '' | '♯' | '♭';
  return {
    step: LETTER_INDEX[letter] + octave * 7 - E4_DIATONIC,
    label: `${name}${octave}`,
    accidental,
  };
}

/** Even staff steps (ledger lines) needed to reach a note below or above the five lines (0–8). */
export function ledgerSteps(step: number): number[] {
  const lines: number[] = [];
  for (let s = -2; s >= step; s -= 2) {
    lines.push(s);
  }
  for (let s = 10; s <= step; s += 2) {
    lines.push(s);
  }
  return lines;
}

/** Whole/half step pattern between successive scale degrees (wrapping to the octave). */
export function stepPattern(intervals: number[]): string[] {
  const steps: number[] = [];
  for (let i = 1; i < intervals.length; i += 1) {
    steps.push(intervals[i] - intervals[i - 1]);
  }
  steps.push(12 - intervals[intervals.length - 1]);
  return steps.map((s) => (s === 1 ? 'H' : s === 2 ? 'W' : s === 3 ? 'W½' : `${s}`));
}

export interface ModeDefinition {
  key: string;
  name: string;
  intervals: number[];
  /** The scale degree that gives the mode its colour. */
  characteristic: string;
}

/** The seven modes of the major scale, ordered bright → dark. */
export const MODES: ModeDefinition[] = [
  { key: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11], characteristic: '♯4' },
  {
    key: 'ionian',
    name: 'Ionian (major)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    characteristic: 'major',
  },
  {
    key: 'mixolydian',
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    characteristic: '♭7',
  },
  { key: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], characteristic: '♮6' },
  {
    key: 'aeolian',
    name: 'Aeolian (minor)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    characteristic: '♭6',
  },
  { key: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10], characteristic: '♭2' },
  { key: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10], characteristic: '♭5' },
];

/**
 * Reverse lookup: every chord (across all 12 roots) whose pitch classes exactly match `selected`.
 * Inversions match naturally because we test the set, not the bass note.
 */
export function identifyChords(selected: Set<number>): string[] {
  if (selected.size < 3) {
    return [];
  }
  const matches: string[] = [];
  for (let root = 0; root < 12; root += 1) {
    for (const chord of CHORDS) {
      if (chord.intervals.length !== selected.size) {
        continue;
      }
      const pcs = chord.intervals.map((interval) => (root + interval) % 12);
      if (pcs.every((pc) => selected.has(pc))) {
        const flats = [1, 3, 5, 8, 10].includes(root);
        matches.push(`${pitchName(root, flats)} ${chord.name}`);
      }
    }
  }
  return matches;
}
