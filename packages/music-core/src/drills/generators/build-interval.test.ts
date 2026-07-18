import { describe, expect, it } from 'vitest';
import { buildIntervalDeck } from './build-interval';

function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('build-interval deck', () => {
  it('sounds a root and expects the pitch class a card-many semitones above it', () => {
    const rng = seeded(1);
    const item = buildIntervalDeck.generate('7', 'beginner', rng); // perfect 5th
    expect(item.modality).toBe('play-instrument');
    expect(item.presentation.kind).toBe('audio');
    if (item.presentation.kind === 'audio') {
      const rootMidi = item.presentation.notes[0].midi;
      expect(item.expected).toBe(String((rootMidi + 7) % 12));
    }
    expect(item.options).toBeUndefined();
  });

  it('carries a localized instruction naming the interval', () => {
    const item = buildIntervalDeck.generate('4', 'beginner', seeded(2)); // major 3rd
    expect(item.instruction).toEqual({
      key: 'drill.playIntervalAbove',
      params: { interval: 'Major 3rd' },
    });
  });

  it('accepts the target pitch class in any octave, rejects a wrong one', () => {
    const item = buildIntervalDeck.generate('5', 'beginner', seeded(3));
    const expected = Number(item.expected);
    expect(buildIntervalDeck.check(item, String(expected)).correct).toBe(true);
    expect(buildIntervalDeck.check(item, String(expected + 12)).correct).toBe(true);
    expect(buildIntervalDeck.check(item, String((expected + 1) % 12)).correct).toBe(false);
  });

  it('keys the deck by ascending intervals 1–12', () => {
    expect(buildIntervalDeck.cards).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
    ]);
  });
});
