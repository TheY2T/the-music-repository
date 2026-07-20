import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SKIN_ID,
  FRETBOARD_SKINS,
  fretboardSkin,
  KEYBOARD_SKINS,
  keyboardSkin,
  toHexColor,
} from './instrument-skins';

describe('instrument-skins', () => {
  it('resolves a known keyboard skin by id', () => {
    expect(keyboardSkin('classic').id).toBe('classic');
    expect(keyboardSkin('neon').kind).toBe('pixi');
  });

  it('resolves a known fretboard skin by id', () => {
    expect(fretboardSkin('sunburst').id).toBe('sunburst');
    expect(fretboardSkin('metallic').effects?.gloss).toBe(true);
  });

  it('falls back to the default theme skin for an unknown id', () => {
    expect(keyboardSkin('does-not-exist').id).toBe(DEFAULT_SKIN_ID);
    expect(fretboardSkin(undefined).id).toBe(DEFAULT_SKIN_ID);
  });

  it('leaves the default theme skin without a fixed palette (it follows tokens)', () => {
    expect(keyboardSkin('theme').palette).toBeUndefined();
    expect(fretboardSkin('theme').palette).toBeUndefined();
  });

  it('gives every non-theme skin a palette and a translatable label key', () => {
    for (const skin of [...KEYBOARD_SKINS, ...FRETBOARD_SKINS]) {
      expect(skin.labelKey.startsWith('skin.')).toBe(true);
      if (skin.kind !== 'token') expect(skin.palette).toBeDefined();
    }
  });

  it('formats a 0xRRGGBB int as a #rrggbb string', () => {
    expect(toHexColor(0x000000)).toBe('#000000');
    expect(toHexColor(0xf6f1e7)).toBe('#f6f1e7');
    expect(toHexColor(0x22d3ee)).toBe('#22d3ee');
  });
});
