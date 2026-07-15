import { describe, expect, it } from 'vitest';
import {
  BASS_TUNING_LOW_FIRST,
  generateChordShapes,
  type Instrument,
  supportedQualities,
} from './chord-library';
import { TUNING_LOW_FIRST, UKULELE_TUNING_LOW_FIRST } from './chord-diagram';

// Chord-tone intervals per quality — mirrors apps/web `CHORDS` (kept local so the UI package stays
// free of app deps). Used to assert generated shapes contain only real chord tones.
const QUALITY_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  sixth: [0, 4, 7, 9],
  'minor-6': [0, 3, 7, 9],
  'major-7': [0, 4, 7, 11],
  'minor-7': [0, 3, 7, 10],
  'dominant-7': [0, 4, 7, 10],
  'half-diminished': [0, 3, 6, 10],
  add9: [0, 4, 7, 14],
  'dominant-9': [0, 4, 7, 10, 14],
};

const TUNINGS: Record<Instrument, number[]> = {
  guitar: TUNING_LOW_FIRST,
  ukulele: UKULELE_TUNING_LOW_FIRST,
  bass: BASS_TUNING_LOW_FIRST,
};

function pcSet(intervals: number[]): Set<number> {
  return new Set(intervals.map((i) => ((i % 12) + 12) % 12));
}

/** Chord tones that must appear — everything except the (omittable) perfect 5th. */
function essentialPcs(rootPc: number, intervals: number[]): Set<number> {
  const hasPerfectFifth = intervals.some((i) => i % 12 === 7);
  const out = new Set<number>();
  for (const i of intervals) {
    const pc = (((rootPc + i) % 12) + 12) % 12;
    if (hasPerfectFifth && pc === (rootPc + 7) % 12) continue;
    out.add(pc);
  }
  return out;
}

describe('generateChordShapes — no wrong notes, root in bass, essentials covered', () => {
  for (const quality of Object.keys(QUALITY_INTERVALS)) {
    it(`voices "${quality}" correctly on guitar across all 12 roots`, () => {
      const intervals = QUALITY_INTERVALS[quality]!;
      const tuning = TUNINGS.guitar;
      for (let root = 0; root < 12; root += 1) {
        const shapes = generateChordShapes(root, quality, 'guitar');
        expect(shapes.length).toBeGreaterThan(0);
        const chordPcs = pcSet(intervals.map((i) => root + i));
        const essentials = essentialPcs(root, intervals);
        for (const shape of shapes) {
          expect(shape.frets).toHaveLength(tuning.length);
          const sounded = shape.frets
            .map((f, s) => (f < 0 ? null : (tuning[s]! + f) % 12))
            .filter((pc): pc is number => pc != null);
          // Every sounded string is a real chord tone.
          for (const pc of sounded) expect(chordPcs.has(pc)).toBe(true);
          // Lowest-pitched sounded string is the root.
          const lowestIdx = shape.frets.findIndex((f) => f >= 0);
          expect((tuning[lowestIdx]! + shape.frets[lowestIdx]!) % 12).toBe(root);
          // Essential tones all present.
          const soundedSet = new Set(sounded);
          for (const pc of essentials) expect(soundedSet.has(pc)).toBe(true);
          // Frets in range; baseFret windows the lowest fretted note.
          const fretted = shape.frets.filter((f) => f > 0);
          expect(Math.max(0, ...fretted)).toBeLessThanOrEqual(15);
          if (shape.baseFret > 1) expect(Math.min(...fretted)).toBe(shape.baseFret);
        }
      }
    });
  }
});

describe('generateChordShapes — instruments', () => {
  it('renders ukulele barre shapes (4 strings) with only chord tones', () => {
    const shapes = generateChordShapes(0, 'major', 'ukulele'); // C major
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape.frets).toHaveLength(4);
      const sounded = shape.frets
        .map((f, s) => (f < 0 ? null : (UKULELE_TUNING_LOW_FIRST[s]! + f) % 12))
        .filter((pc): pc is number => pc != null);
      for (const pc of sounded) expect(pcSet([0, 4, 7]).has(pc)).toBe(true);
    }
  });

  it('renders bass root grips (root in bass, 4 strings) for any quality', () => {
    const shapes = generateChordShapes(0, 'minor-7', 'bass'); // C on bass
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape.frets).toHaveLength(4);
      const lowestIdx = shape.frets.findIndex((f) => f >= 0);
      expect((BASS_TUNING_LOW_FIRST[lowestIdx]! + shape.frets[lowestIdx]!) % 12).toBe(0);
    }
  });

  it('returns an empty list for an unsupported quality (graceful degrade)', () => {
    expect(generateChordShapes(0, 'dominant-13', 'ukulele')).toEqual([]);
  });
});

describe('generateChordShapes — concrete known shapes', () => {
  it('gives open E major as the lowest E-shape voicing', () => {
    const first = generateChordShapes(4, 'major', 'guitar')[0]!;
    expect(first.frets).toEqual([0, 2, 2, 1, 0, 0]);
    expect(first.baseFret).toBe(1);
  });

  it('gives the A-shape C major barre (3rd fret) as C major’s lowest voicing', () => {
    const first = generateChordShapes(0, 'major', 'guitar')[0]!;
    expect(first.frets).toEqual([-1, 3, 5, 5, 5, 3]);
    expect(first.baseFret).toBe(3);
  });

  it('names shapes from the root + quality suffix', () => {
    expect(generateChordShapes(6, 'minor-7', 'guitar')[0]!.name).toBe('F♯m7');
  });
});

describe('supportedQualities', () => {
  it('lists the qualities each instrument can render', () => {
    expect(supportedQualities('guitar')).toContain('major-7');
    expect(supportedQualities('ukulele')).toContain('minor-7');
    expect(supportedQualities('ukulele')).not.toContain('add9');
  });
});
