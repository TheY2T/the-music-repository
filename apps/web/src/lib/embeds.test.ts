import { describe, expect, it } from 'vitest';
import {
  chordLibraryFor,
  chordToMidi,
  findChordShape,
  noteNameToPitchClass,
  parseChordSymbol,
  tuningFor,
} from './embeds';
import { CHORDS } from './music-theory';

describe('noteNameToPitchClass', () => {
  it('parses natural note names', () => {
    expect(noteNameToPitchClass('C')).toBe(0);
    expect(noteNameToPitchClass('A')).toBe(9);
    expect(noteNameToPitchClass('B')).toBe(11);
  });
  it('parses sharps and flats', () => {
    expect(noteNameToPitchClass('C#')).toBe(1);
    expect(noteNameToPitchClass('Db')).toBe(1);
    expect(noteNameToPitchClass('Bb')).toBe(10);
  });
  it('normalises a lowercase leading letter', () => {
    expect(noteNameToPitchClass('a')).toBe(9);
  });
  it('returns null for empty or unknown input', () => {
    expect(noteNameToPitchClass(undefined)).toBeNull();
    expect(noteNameToPitchClass('')).toBeNull();
    expect(noteNameToPitchClass('H')).toBeNull();
  });
});

describe('chordLibraryFor / tuningFor', () => {
  it('selects the ukulele library + tuning for ukulele', () => {
    expect(chordLibraryFor('ukulele')).not.toBe(chordLibraryFor('guitar'));
    expect(tuningFor('ukulele')).toHaveLength(4);
  });
  it('defaults to guitar (6 strings) for anything else', () => {
    expect(tuningFor('guitar')).toHaveLength(6);
    expect(tuningFor(undefined)).toHaveLength(6);
  });
});

describe('findChordShape', () => {
  it('finds a guitar open seventh chord', () => {
    const a7 = findChordShape('A7', 'guitar');
    expect(a7?.name).toBe('A7');
    expect(a7?.frets).toHaveLength(6);
  });
  it('finds a ukulele shape with four strings', () => {
    const c = findChordShape('C', 'ukulele');
    expect(c?.name).toBe('C');
    expect(c?.frets).toHaveLength(4);
  });
  it('returns null for an unknown symbol', () => {
    expect(findChordShape('Zdim13', 'guitar')).toBeNull();
  });
});

describe('parseChordSymbol', () => {
  it('parses triads', () => {
    expect(parseChordSymbol('C')).toEqual({ root: 0, intervals: [0, 4, 7] });
    expect(parseChordSymbol('Dm')).toEqual({ root: 2, intervals: [0, 3, 7] });
    expect(parseChordSymbol('Bdim')).toEqual({ root: 11, intervals: [0, 3, 6] });
  });
  it('parses sevenths + the longest-suffix-first (m7b5 not m)', () => {
    expect(parseChordSymbol('G7')).toEqual({ root: 7, intervals: [0, 4, 7, 10] });
    expect(parseChordSymbol('Cmaj7')).toEqual({ root: 0, intervals: [0, 4, 7, 11] });
    expect(parseChordSymbol('Bm7b5')).toEqual({ root: 11, intervals: [0, 3, 6, 10] });
  });
  it('parses the expanded vocabulary (6ths, extensions, alterations)', () => {
    expect(parseChordSymbol('C6')).toEqual({ root: 0, intervals: [0, 4, 7, 9] });
    expect(parseChordSymbol('Am6')).toEqual({ root: 9, intervals: [0, 3, 7, 9] });
    expect(parseChordSymbol('Cadd9')).toEqual({ root: 0, intervals: [0, 4, 7, 14] });
    expect(parseChordSymbol('C9')).toEqual({ root: 0, intervals: [0, 4, 7, 10, 14] });
    expect(parseChordSymbol('Cmaj9')).toEqual({ root: 0, intervals: [0, 4, 7, 11, 14] });
    expect(parseChordSymbol('C7b9')).toEqual({ root: 0, intervals: [0, 4, 7, 10, 13] });
    expect(parseChordSymbol('Cø')).toEqual({ root: 0, intervals: [0, 3, 6, 10] });
  });
  it('parses a flat root', () => {
    expect(parseChordSymbol('Bbm')).toEqual({ root: 10, intervals: [0, 3, 7] });
  });
  it('returns null for junk', () => {
    expect(parseChordSymbol('H7')).toBeNull();
  });
});

describe('single source of truth: every CHORDS symbol round-trips through parseChordSymbol', () => {
  it('resolves each chord symbol + alias to its defining intervals', () => {
    for (const chord of CHORDS) {
      for (const suffix of [chord.symbol, ...(chord.aliases ?? [])]) {
        expect(parseChordSymbol(`C${suffix}`)).toEqual({ root: 0, intervals: chord.intervals });
      }
    }
  });
});

describe('chordToMidi', () => {
  it('voices a C major triad from octave 4', () => {
    expect(chordToMidi('C')).toEqual([60, 64, 67]);
  });
  it('voices a G7', () => {
    expect(chordToMidi('G7')).toEqual([67, 71, 74, 77]);
  });
  it('returns null for an unknown symbol', () => {
    expect(chordToMidi('H')).toBeNull();
  });
});
