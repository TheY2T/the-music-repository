import { describe, expect, it } from 'vitest';
import { buildPianoVoicings, drop, invert } from './piano-voicings';

describe('invert', () => {
  it('moves the lowest n notes up an octave and keeps ascending order', () => {
    expect(invert([60, 64, 67], 1)).toEqual([64, 67, 72]); // 1st inversion of C major
    expect(invert([60, 64, 67], 2)).toEqual([67, 72, 76]); // 2nd inversion
  });
});

describe('drop', () => {
  it('drops the nth-from-top voice down an octave', () => {
    expect(drop([60, 64, 67, 70], 2)).toEqual([55, 60, 64, 70]); // drop-2 of C7
  });
});

describe('buildPianoVoicings', () => {
  it('gives root position + two inversions + open for a triad', () => {
    const v = buildPianoVoicings(60, [0, 4, 7]); // C major
    expect(v.map((x) => x.key)).toEqual(['close', 'inv1', 'inv2', 'open']);
    expect(v[0]!.inversion).toBe(0);
    expect(v[0]!.midis).toEqual([60, 64, 67]);
    expect(v[1]!.inversion).toBe(1);
    expect(v[1]!.midis).toEqual([64, 67, 72]);
  });

  it('gives three inversions + drop/shell voicings for a seventh chord', () => {
    const v = buildPianoVoicings(60, [0, 4, 7, 10]); // C7
    expect(v.map((x) => x.key)).toEqual([
      'close',
      'inv1',
      'inv2',
      'inv3',
      'drop2',
      'drop3',
      'shell',
    ]);
    expect(v.find((x) => x.key === 'shell')!.midis).toEqual([60, 64, 70]); // 1-3-7
  });

  it('labels the bass tone of each inversion accurately', () => {
    const v = buildPianoVoicings(60, [0, 4, 7]); // C major
    expect(v[1]!.description).toBe('The 3 is in the bass.');
    expect(v[2]!.description).toBe('The 5 is in the bass.');
  });

  it('handles a power chord (dyad) without producing NaN notes', () => {
    const v = buildPianoVoicings(60, [0, 7]); // C5
    expect(v.map((x) => x.key)).toEqual(['close', 'inv1']);
    for (const voicing of v) {
      for (const midi of voicing.midis) expect(Number.isFinite(midi)).toBe(true);
    }
  });

  it('caps inversions at the 3rd and adds a shell for extended chords', () => {
    const v = buildPianoVoicings(60, [0, 4, 7, 10, 14]); // C9
    expect(v.map((x) => x.key)).toEqual(['close', 'inv1', 'inv2', 'inv3', 'shell']);
  });
});
