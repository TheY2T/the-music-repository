import { describe, expect, it } from 'vitest';
import { detectedPitchClass, sustainedPitchClass } from './pitch-match';

describe('detectedPitchClass', () => {
  it('is null for no detected frequency', () => {
    expect(detectedPitchClass(null)).toBeNull();
  });

  it('maps a frequency to its pitch class (A4 = 440 → 9)', () => {
    expect(detectedPitchClass(440)).toBe(9); // A
    expect(detectedPitchClass(261.63)).toBe(0); // C4
  });

  it('rejects an ambiguous reading near the semitone boundary (cents tolerance)', () => {
    // A quarter-tone above A4 (~452.9 Hz) sits ~+50¢ — too ambiguous to submit.
    const quarterToneSharp = 440 * 2 ** (0.5 / 12);
    expect(detectedPitchClass(quarterToneSharp, 45)).toBeNull();
    // A slightly-sharp A4 (~+20¢) is still confidently A.
    const slightlySharp = 440 * 2 ** (0.2 / 12);
    expect(detectedPitchClass(slightlySharp, 45)).toBe(9);
  });
});

describe('sustainedPitchClass', () => {
  it('returns null until enough consistent frames accumulate', () => {
    expect(sustainedPitchClass([9, 9], 4)).toBeNull();
    expect(sustainedPitchClass([9, 9, 9, 9], 4)).toBe(9);
  });

  it('requires the last N frames to agree', () => {
    expect(sustainedPitchClass([9, 9, 9, 7], 4)).toBeNull(); // wavered on the last frame
    expect(sustainedPitchClass([7, 9, 9, 9, 9], 4)).toBe(9); // last 4 agree
  });

  it('is null when the sustained value is a gap (null)', () => {
    expect(sustainedPitchClass([null, null, null, null], 4)).toBeNull();
  });
});
