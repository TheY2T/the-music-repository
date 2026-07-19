import { afterEach, describe, expect, it } from 'vitest';
import {
  clampIntensity,
  DEFAULT_INTENSITY,
  DEFAULT_STYLE,
  getBackgroundPref,
  setBackgroundPref,
} from './dashboard-background';

afterEach(() => {
  localStorage.clear();
});

describe('clampIntensity', () => {
  it('clamps to 0–100 and rounds', () => {
    expect(clampIntensity(-20)).toBe(0);
    expect(clampIntensity(250)).toBe(100);
    expect(clampIntensity(54.6)).toBe(55);
  });

  it('falls back to the default for NaN', () => {
    expect(clampIntensity(Number.NaN)).toBe(DEFAULT_INTENSITY);
  });
});

describe('getBackgroundPref', () => {
  it('returns defaults when nothing is stored', () => {
    expect(getBackgroundPref()).toEqual({ style: DEFAULT_STYLE, intensity: DEFAULT_INTENSITY });
  });

  it('round-trips a saved preference', () => {
    setBackgroundPref({ style: 'roll', intensity: 80 });
    expect(getBackgroundPref()).toEqual({ style: 'roll', intensity: 80 });
  });

  it('ignores an unknown style and clamps a stored intensity', () => {
    localStorage.setItem('tmr.dashboardBg.style', 'bogus');
    localStorage.setItem('tmr.dashboardBg.intensity', '999');
    expect(getBackgroundPref()).toEqual({ style: DEFAULT_STYLE, intensity: 100 });
  });

  it('persists the clamped intensity, not the raw value', () => {
    setBackgroundPref({ style: 'waves', intensity: -5 });
    expect(localStorage.getItem('tmr.dashboardBg.intensity')).toBe('0');
  });
});
