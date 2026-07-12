import { describe, expect, it } from 'vitest';
import { midiToFrequency, pitchName, scalePitchClasses } from './music-theory';

describe('pitchName', () => {
  it('names sharps by default and flats when asked', () => {
    expect(pitchName(0)).toBe('C');
    expect(pitchName(1)).toBe('C♯');
    expect(pitchName(1, true)).toBe('D♭');
  });

  it('wraps pitch classes into 0–11 (negative and >11)', () => {
    expect(pitchName(12)).toBe('C');
    expect(pitchName(-1)).toBe('B');
    expect(pitchName(13)).toBe('C♯');
  });
});

describe('midiToFrequency', () => {
  it('anchors A4 (MIDI 69) at 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
  });

  it('halves an octave down and doubles an octave up', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 6);
    expect(midiToFrequency(81)).toBeCloseTo(880, 6);
  });
});

describe('scalePitchClasses', () => {
  it('builds a C major scale (root 0)', () => {
    const pcs = scalePitchClasses(0, [0, 2, 4, 5, 7, 9, 11]);
    expect([...pcs].sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('wraps around the octave for a D major scale (root 2)', () => {
    const pcs = scalePitchClasses(2, [0, 2, 4, 5, 7, 9, 11]);
    expect(pcs.has(1)).toBe(true); // C♯
    expect(pcs.has(6)).toBe(true); // F♯
    expect(pcs.has(0)).toBe(false);
  });
});
