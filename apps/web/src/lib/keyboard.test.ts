import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KEYBOARD_KEYS,
  isBlackKey,
  KEYBOARD_SIZES,
  keyLayout,
  layoutForKeys,
  qwertyMap,
} from './keyboard';

describe('isBlackKey', () => {
  it('classifies the 5 black pitch classes', () => {
    expect([1, 3, 6, 8, 10].map(isBlackKey)).toEqual([true, true, true, true, true]);
    expect([0, 2, 4, 5, 7, 9, 11].map(isBlackKey)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
  it('handles octaves (C4 white, C#4 black)', () => {
    expect(isBlackKey(60)).toBe(false);
    expect(isBlackKey(61)).toBe(true);
  });
});

describe('KEYBOARD_SIZES', () => {
  it('every size has the right key count and a start note, defaulting to 61', () => {
    expect(KEYBOARD_SIZES.map((s) => s.keys)).toEqual([25, 37, 49, 61, 76, 88]);
    expect(DEFAULT_KEYBOARD_KEYS).toBe(61);
  });

  it('standard ranges: 88=A0–C8, 76=E1–G7, 61=C2–C7', () => {
    const byKeys = Object.fromEntries(KEYBOARD_SIZES.map((s) => [s.keys, s.startMidi]));
    expect(byKeys[88]).toBe(21); // A0
    expect(byKeys[76]).toBe(28); // E1
    expect(byKeys[61]).toBe(36); // C2
    expect(byKeys[25]).toBe(48); // C3
  });
});

describe('keyLayout', () => {
  it('splits a two-octave C4 range into 14 white + 10 black keys', () => {
    const { midis, whiteMidis, blackMidis, whiteWidthPct } = keyLayout(60, 24);
    expect(midis).toHaveLength(24);
    expect(whiteMidis).toHaveLength(14);
    expect(blackMidis).toHaveLength(10);
    expect(whiteWidthPct).toBeCloseTo(100 / 14);
  });

  it('positions each black key after the correct white index (C#4 after white 0)', () => {
    const { blackMidis } = keyLayout(60, 24);
    expect(blackMidis[0]).toEqual({ midi: 61, afterWhiteIndex: 0 });
  });

  it.each(KEYBOARD_SIZES)('$keys keys → white+black sums to the key count', (size) => {
    const { whiteMidis, blackMidis } = keyLayout(size.startMidi, size.keys);
    expect(whiteMidis.length + blackMidis.length).toBe(size.keys);
  });

  it('88-key range spans A0 (21) to C8 (108)', () => {
    const { midis } = layoutForKeys(88);
    expect(midis[0]).toBe(21);
    expect(midis[midis.length - 1]).toBe(108);
  });
});

describe('qwertyMap', () => {
  it('maps the z-row to the base octave and the q-row an octave up', () => {
    const map = qwertyMap(60); // base C4
    expect(map.get('KeyZ')).toBe(60); // C4
    expect(map.get('KeyS')).toBe(61); // C#4
    expect(map.get('KeyM')).toBe(71); // B4
    expect(map.get('KeyQ')).toBe(72); // C5
    expect(map.get('KeyI')).toBe(84); // C6
  });

  it('re-bases when the octave shifts', () => {
    expect(qwertyMap(48).get('KeyZ')).toBe(48); // C3
  });
});
