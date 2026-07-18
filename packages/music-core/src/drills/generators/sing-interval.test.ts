import { describe, expect, it } from 'vitest';
import { singIntervalDeck } from './sing-interval';

const rng = () => 0.5;

describe('sing-interval deck', () => {
  it('is a pitch-mic drill over comfortable-to-sing intervals', () => {
    expect(singIntervalDeck.modality).toBe('pitch-mic');
    expect(singIntervalDeck.cards).toEqual(['2', '3', '4', '5', '7', '9', '12']);
  });

  it('plays a root and expects the pitch class an interval above it', () => {
    const item = singIntervalDeck.generate('7', 'intermediate', rng); // perfect 5th
    expect(item.presentation.kind).toBe('audio');
    if (item.presentation.kind === 'audio') {
      const rootMidi = item.presentation.notes[0].midi;
      expect(item.expected).toBe(String((rootMidi + 7) % 12));
    }
    expect(item.instruction).toEqual({
      key: 'drill.singIntervalAbove',
      params: { interval: 'Perfect 5th' },
    });
  });

  it('accepts the sung pitch class in any octave', () => {
    const item = singIntervalDeck.generate('4', 'intermediate', rng);
    const expected = Number(item.expected);
    expect(singIntervalDeck.check(item, String(expected)).correct).toBe(true);
    expect(singIntervalDeck.check(item, String(expected + 12)).correct).toBe(true);
    expect(singIntervalDeck.check(item, String((expected + 1) % 12)).correct).toBe(false);
  });
});
