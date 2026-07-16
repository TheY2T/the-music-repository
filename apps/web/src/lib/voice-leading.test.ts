import { describe, expect, it } from 'vitest';
import { nearestMidiForPc, voiceLead, voiceMoves } from './voice-leading';

describe('nearestMidiForPc', () => {
  it('finds the closest octave of a pitch class', () => {
    expect(nearestMidiForPc(60, 0)).toBe(60); // C at C4
    expect(nearestMidiForPc(64, 5)).toBe(65); // F just above E4
    expect(nearestMidiForPc(67, 9)).toBe(69); // A just above G4
    expect(nearestMidiForPc(60, 11)).toBe(59); // B below C4 is nearer than B above
  });
});

describe('voiceLead', () => {
  it('holds the common tone and steps the rest (C major → F major)', () => {
    // C E G (60 64 67) → F A C: C is common (held at 60), E→F (+1), G→A (+2).
    expect(voiceLead([60, 64, 67], [5, 9, 0])).toEqual([60, 65, 69]);
  });

  it('holds both common tones and moves only the odd voice (C major → A minor)', () => {
    // A minor = A C E; C and E are shared, so hold them and step G→A. Result C4 E4 A4.
    expect(voiceLead([60, 64, 67], [9, 0, 4])).toEqual([60, 64, 69]);
  });

  it('voices sevenths smoothly (Dm7 → G7)', () => {
    // D F A C (62 65 69 72) → G B D F: total movement is small, common tones (D, F) stay near.
    const out = voiceLead([62, 65, 69, 72], [7, 11, 2, 5]);
    expect(out).toHaveLength(4);
    const moved = out.reduce((s, v, i) => s + Math.abs(v - [62, 65, 69, 72][i]), 0);
    expect(moved).toBeLessThan(12); // smoother than jumping to root position
  });
});

describe('voiceMoves', () => {
  it('pairs each voice with its nearest destination and marks held tones', () => {
    const moves = voiceMoves([60, 64, 67], [60, 65, 69]);
    expect(moves[0]).toEqual({ from: 60, to: 60, interval: 0 }); // common tone
    expect(moves.map((m) => m.interval).sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });
});
