import { describe, expect, it } from 'vitest';
import { accuracyToQuality } from './grade';

describe('accuracyToQuality', () => {
  it('lapses (2) below 0.5 accuracy', () => {
    expect(accuracyToQuality({ accuracy: 0 })).toBe(2);
    expect(accuracyToQuality({ accuracy: 0.49 })).toBe(2);
  });

  it('gives a shaky pass (3) for partial accuracy', () => {
    expect(accuracyToQuality({ accuracy: 0.5 })).toBe(3);
    expect(accuracyToQuality({ accuracy: 0.99 })).toBe(3);
  });

  it('gives Good (4) for a full but slow/untimed answer', () => {
    expect(accuracyToQuality({ accuracy: 1 })).toBe(4);
    expect(accuracyToQuality({ accuracy: 1, responseMs: 9000, expectedMs: 4000 })).toBe(4);
  });

  it('gives Easy (5) for a full, fast answer', () => {
    expect(accuracyToQuality({ accuracy: 1, responseMs: 1000, expectedMs: 4000 })).toBe(5);
  });
});
