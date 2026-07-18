import { describe, expect, it } from 'vitest';
import { cadenceEarDeck } from './cadence-ear';
import { progressionEarDeck } from './progression-ear';

const rng = () => 0.5;

describe('progression-ear deck', () => {
  it('plays a multi-chord progression and expects its Roman-numeral label', () => {
    const item = progressionEarDeck.generate('pop-axis', 'beginner', rng);
    expect(item.modality).toBe('ear-identify');
    expect(item.expected).toBe('I–V–vi–IV');
    expect(item.answerLabel).toBe('I–V–vi–IV');
    // Four chords × 3 tones each, played as a block sequence.
    if (item.presentation.kind === 'audio') {
      const startTimes = new Set(item.presentation.notes.map((n) => n.atMs));
      expect(startTimes.size).toBe(4); // four distinct chord onsets
      expect(item.presentation.notes.length).toBeGreaterThanOrEqual(12);
    }
    expect(item.options?.some((o) => o.value === 'I–V–vi–IV')).toBe(true);
  });

  it('scores the right label correct and another wrong', () => {
    const item = progressionEarDeck.generate('folk-145', 'beginner', rng);
    expect(progressionEarDeck.check(item, item.expected).correct).toBe(true);
    expect(progressionEarDeck.check(item, 'I–V–vi–IV').correct).toBe(false);
  });
});

describe('cadence-ear deck', () => {
  it('opens on the tonic then plays the cadence, keyed by cadence type', () => {
    expect(cadenceEarDeck.cards).toEqual(['authentic', 'plagal', 'half', 'deceptive']);
    const item = cadenceEarDeck.generate('authentic', 'intermediate', rng);
    expect(item.expected).toBe('Authentic (V–I)');
    if (item.presentation.kind === 'audio') {
      const onsets = new Set(item.presentation.notes.map((n) => n.atMs));
      expect(onsets.size).toBe(3); // tonic + two cadence chords
    }
  });

  it('checks the cadence label objectively', () => {
    const item = cadenceEarDeck.generate('deceptive', 'intermediate', rng);
    expect(cadenceEarDeck.check(item, 'Deceptive (V–vi)').correct).toBe(true);
    expect(cadenceEarDeck.check(item, 'Authentic (V–I)').correct).toBe(false);
  });
});
