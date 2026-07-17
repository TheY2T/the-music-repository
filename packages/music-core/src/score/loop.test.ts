import { describe, expect, it } from 'vitest';
import { resolveDisplayMode, tabTuningFor } from './loop';

describe('resolveDisplayMode', () => {
  it('routes fretted-only scores to tab (alphaTab default guitar UI)', () => {
    expect(resolveDisplayMode(['guitar'])).toBe('tab');
    expect(resolveDisplayMode(['bass'])).toBe('tab');
    expect(resolveDisplayMode(['ukulele'])).toBe('tab');
  });
  it('routes piano-based scores to standard notation (incl. piano+guitar)', () => {
    expect(resolveDisplayMode(['piano'])).toBe('standard');
    expect(resolveDisplayMode(['piano', 'guitar'])).toBe('standard');
  });
  it('defaults empty/other to standard', () => {
    expect(resolveDisplayMode([])).toBe('standard');
    expect(resolveDisplayMode(['violin'])).toBe('standard');
  });
  it('honors an explicit override', () => {
    expect(resolveDisplayMode(['guitar'], 'standard')).toBe('standard');
    expect(resolveDisplayMode(['piano'], 'tab')).toBe('tab');
  });
});

describe('tabTuningFor', () => {
  it('returns standard tunings for fretted instruments (string 1 highest)', () => {
    expect(tabTuningFor(['guitar'])).toEqual([64, 59, 55, 50, 45, 40]); // EADGBE
    expect(tabTuningFor(['bass'])).toEqual([43, 38, 33, 28]); // EADG
    expect(tabTuningFor(['ukulele'])).toEqual([69, 64, 60, 67]); // gCEA
  });
  it('returns null for non-fretted scores', () => {
    expect(tabTuningFor(['piano'])).toBeNull();
    expect(tabTuningFor([])).toBeNull();
  });
  it('picks the first fretted instrument when several are present', () => {
    expect(tabTuningFor(['piano', 'guitar'])).toEqual([64, 59, 55, 50, 45, 40]);
  });
});
