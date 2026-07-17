import { describe, expect, it } from 'vitest';
import { beatsFor, valueLabel } from './rhythm';

describe('beatsFor', () => {
  it('maps note values to beats (quarter = 1)', () => {
    expect(beatsFor('whole')).toBe(4);
    expect(beatsFor('half')).toBe(2);
    expect(beatsFor('quarter')).toBe(1);
    expect(beatsFor('eighth')).toBe(0.5);
    expect(beatsFor('sixteenth')).toBe(0.25);
    expect(beatsFor('dotted-half')).toBe(3);
  });
  it('defaults an unknown token to one beat', () => {
    expect(beatsFor('mystery')).toBe(1);
  });
});

describe('valueLabel', () => {
  it('gives short labels', () => {
    expect(valueLabel('quarter')).toBe('quarter');
    expect(valueLabel('eighth')).toBe('8th');
    expect(valueLabel('sixteenth')).toBe('16th');
  });
  it('falls back to the token', () => {
    expect(valueLabel('mystery')).toBe('mystery');
  });
});
