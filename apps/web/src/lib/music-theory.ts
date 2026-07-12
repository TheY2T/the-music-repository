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

export interface ScaleDefinition {
  key: string;
  name: string;
  /** Semitone offsets from the root. */
  intervals: number[];
}

export const SCALES: ScaleDefinition[] = [
  { key: 'major', name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { key: 'natural-minor', name: 'Natural minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { key: 'harmonic-minor', name: 'Harmonic minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { key: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { key: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { key: 'major-pentatonic', name: 'Major pentatonic', intervals: [0, 2, 4, 7, 9] },
  { key: 'minor-pentatonic', name: 'Minor pentatonic', intervals: [0, 3, 5, 7, 10] },
  { key: 'blues', name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { key: 'chromatic', name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

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
  /** Semitone offsets from the root. */
  intervals: number[];
}

export const CHORDS: ChordDefinition[] = [
  { key: 'major', name: 'Major', intervals: [0, 4, 7] },
  { key: 'minor', name: 'Minor', intervals: [0, 3, 7] },
  { key: 'diminished', name: 'Diminished', intervals: [0, 3, 6] },
  { key: 'augmented', name: 'Augmented', intervals: [0, 4, 8] },
  { key: 'sus2', name: 'Suspended 2nd', intervals: [0, 2, 7] },
  { key: 'sus4', name: 'Suspended 4th', intervals: [0, 5, 7] },
  { key: 'major-7', name: 'Major 7th', intervals: [0, 4, 7, 11] },
  { key: 'minor-7', name: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { key: 'dominant-7', name: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { key: 'diminished-7', name: 'Diminished 7th', intervals: [0, 3, 6, 9] },
];

const INTERVAL_LABELS = ['R', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♯5', '6', '♭7', '7'];

/** Scale-degree label for a semitone offset (0 = root). */
export function intervalLabel(semitones: number): string {
  return INTERVAL_LABELS[((semitones % 12) + 12) % 12];
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
