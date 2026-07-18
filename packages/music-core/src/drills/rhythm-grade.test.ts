import { describe, expect, it } from 'vitest';
import { gradeRhythm, patternOnsets } from './rhythm-grade';

describe('patternOnsets', () => {
  it('converts a 16-step grid to beat positions', () => {
    expect(
      patternOnsets(
        [true, false, false, false, true, false, false, false].concat(Array(8).fill(false)),
      ),
    ).toEqual([0, 1]);
    // quarter notes: steps 0,4,8,12 → beats 0,1,2,3
    const quarters = Array.from({ length: 16 }, (_, i) => i % 4 === 0);
    expect(patternOnsets(quarters)).toEqual([0, 1, 2, 3]);
  });
});

describe('gradeRhythm', () => {
  const expected = [0, 1, 2, 3];

  it('is perfect for exact taps', () => {
    expect(gradeRhythm(expected, [0, 1, 2, 3], 0.3)).toMatchObject({ matched: 4, accuracy: 1 });
  });

  it('accepts taps within the tolerance window', () => {
    expect(gradeRhythm(expected, [0.1, 0.95, 2.05, 3.1], 0.3).accuracy).toBe(1);
  });

  it('gives partial credit for a missed onset', () => {
    // Tapped 2 of 4 → 2 / max(4,2) = 0.5.
    expect(gradeRhythm(expected, [0, 1], 0.3)).toMatchObject({ matched: 2, accuracy: 0.5 });
  });

  it('penalizes spurious extra taps', () => {
    // 4 matched but 5 taps → 4 / max(4,5) = 0.8.
    expect(gradeRhythm(expected, [0, 1, 2, 3, 3.5], 0.3).accuracy).toBeCloseTo(0.8);
  });

  it('does not match a tap outside the tolerance', () => {
    expect(gradeRhythm([0], [0.5], 0.3).matched).toBe(0);
  });
});
