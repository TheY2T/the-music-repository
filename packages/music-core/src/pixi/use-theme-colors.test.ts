import { describe, expect, it } from 'vitest';
import { parseRgb, readThemeColors } from './use-theme-colors';

describe('parseRgb', () => {
  it('parses rgb(...) to a 0xRRGGBB int', () => {
    expect(parseRgb('rgb(199, 154, 59)')).toBe(0xc79a3b);
    expect(parseRgb('rgb(0, 0, 0)')).toBe(0x000000);
    expect(parseRgb('rgb(255, 255, 255)')).toBe(0xffffff);
  });

  it('parses rgba(...) ignoring the alpha channel', () => {
    expect(parseRgb('rgba(255, 0, 0, 0.5)')).toBe(0xff0000);
  });

  it('tolerates extra whitespace', () => {
    expect(parseRgb('rgb( 16 , 32 , 48 )')).toBe(0x102030);
  });

  it('returns null for non-rgb input', () => {
    expect(parseRgb('transparent')).toBeNull();
    expect(parseRgb('#c79a3b')).toBeNull();
    expect(parseRgb('')).toBeNull();
  });
});

describe('readThemeColors', () => {
  it('returns every semantic token as a number and never throws', () => {
    const colors = readThemeColors();
    for (const value of Object.values(colors)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffff);
    }
    // The key set is stable — scenes rely on these being present.
    expect(colors).toHaveProperty('accent');
    expect(colors).toHaveProperty('background');
    expect(colors).toHaveProperty('foreground');
  });
});
