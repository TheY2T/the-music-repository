import { describe, expect, it } from 'vitest';
import { detectPitchHz, hzToNote } from './pitch-detection';

/** A pure sine wave buffer at `freq` Hz. */
function sine(freq: number, sampleRate = 44100, size = 2048): Float32Array {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

describe('detectPitchHz', () => {
  it('recovers the fundamental of a pure sine (A4 = 440 Hz)', () => {
    const hz = detectPitchHz(sine(440), 44100);
    expect(hz).not.toBeNull();
    expect(hz as number).toBeCloseTo(440, -1); // within a few Hz
  });

  it('recovers a low guitar E (~82.4 Hz)', () => {
    const hz = detectPitchHz(sine(82.41), 44100);
    expect(hz).not.toBeNull();
    expect(Math.abs((hz as number) - 82.41)).toBeLessThan(3);
  });

  it('returns null for silence', () => {
    expect(detectPitchHz(new Float32Array(2048), 44100)).toBeNull();
  });
});

describe('hzToNote', () => {
  it('maps 440 Hz to A4 with zero cents', () => {
    const n = hzToNote(440);
    expect(n.name).toBe('A');
    expect(n.octave).toBe(4);
    expect(n.cents).toBe(0);
  });

  it('reports a sharp note as positive cents', () => {
    const n = hzToNote(445); // ~+20 cents above A4
    expect(n.name).toBe('A');
    expect(n.cents).toBeGreaterThan(0);
  });

  it('maps 261.63 Hz to middle C (C4)', () => {
    const n = hzToNote(261.63);
    expect(n.name).toBe('C');
    expect(n.octave).toBe(4);
    expect(Math.abs(n.cents)).toBeLessThanOrEqual(1);
  });
});
