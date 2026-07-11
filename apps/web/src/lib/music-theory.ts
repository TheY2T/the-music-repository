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

export interface DiatonicChord {
  roman: string;
  name: string;
}

/** The seven diatonic triads of the major key on `rootPitchClass`. */
export function diatonicChords(rootPitchClass: number, flats: boolean): DiatonicChord[] {
  const majorScale = [0, 2, 4, 5, 7, 9, 11];
  return majorScale.map((interval, degree) => ({
    roman: MAJOR_ROMAN[degree],
    name: `${pitchName((rootPitchClass + interval) % 12, flats)}${MAJOR_QUALITY[degree]}`,
  }));
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
