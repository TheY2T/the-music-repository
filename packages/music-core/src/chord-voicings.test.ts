import { describe, expect, it } from 'vitest';
import { TUNING_LOW_FIRST } from './chord-shapes';
import { importedVoicingsFor, voicingsFor } from './chord-voicings';

describe('importedVoicingsFor', () => {
  it('returns real-world guitar voicings with fingering + barre data', () => {
    const cMajor = importedVoicingsFor(0, 'major', 'guitar');
    expect(cMajor.length).toBeGreaterThan(1);
    expect(cMajor[0]!.frets).toEqual([-1, 3, 2, 0, 1, 0]); // open C
    expect(cMajor[0]!.fingers).toEqual([0, 3, 2, 0, 1, 0]);
    const barreShape = cMajor.find((s) => (s.barres?.length ?? 0) > 0);
    expect(barreShape).toBeDefined();
  });

  it('covers extended qualities the generator lacks (e.g. Cmaj9)', () => {
    expect(importedVoicingsFor(0, 'major-9', 'guitar').length).toBeGreaterThan(0);
  });

  it('has no imported voicings for bass', () => {
    expect(importedVoicingsFor(0, 'major', 'bass')).toEqual([]);
  });

  it('every imported guitar voicing sounds only chord tones', () => {
    const cMajorPcs = new Set([0, 4, 7]);
    for (const shape of importedVoicingsFor(0, 'major', 'guitar')) {
      const sounded = shape.frets
        .map((f, s) => (f < 0 ? null : (TUNING_LOW_FIRST[s]! + f) % 12))
        .filter((pc): pc is number => pc != null);
      for (const pc of sounded) expect(cMajorPcs.has(pc)).toBe(true);
    }
  });
});

describe('voicingsFor', () => {
  it('prefers imported voicings when available', () => {
    expect(voicingsFor(0, 'major', 'guitar')).toBe(importedVoicingsFor(0, 'major', 'guitar'));
  });

  it('falls back to the generator for power chords (no imported data)', () => {
    const shapes = voicingsFor(4, 'power', 'guitar'); // E5
    expect(shapes.length).toBeGreaterThan(0);
    // Root in the bass.
    const first = shapes[0]!;
    const lowestIdx = first.frets.findIndex((f) => f >= 0);
    expect((TUNING_LOW_FIRST[lowestIdx]! + first.frets[lowestIdx]!) % 12).toBe(4);
  });

  it('falls back to the generator for bass', () => {
    expect(voicingsFor(0, 'major', 'bass').length).toBeGreaterThan(0);
  });
});
