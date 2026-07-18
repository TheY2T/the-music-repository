import { describe, expect, it } from 'vitest';
import { rhythmEchoDeck } from './rhythm-echo';

describe('rhythm-echo deck', () => {
  it('presents a one-bar rhythm pattern to tap back', () => {
    const item = rhythmEchoDeck.generate('quarters', 'beginner', Math.random);
    expect(item.modality).toBe('rhythm-tap');
    expect(item.presentation.kind).toBe('rhythm');
    if (item.presentation.kind === 'rhythm') {
      expect(item.presentation.pattern).toHaveLength(16);
      expect(item.presentation.bpm).toBe(90);
    }
    expect(item.expected).toBe('0,1,2,3');
    expect(item.answerLabel).toBe('Quarter notes');
    expect(item.instruction).toEqual({ key: 'drill.tapRhythm' });
  });

  it('marks a tapped-in-time performance correct with full accuracy', () => {
    const item = rhythmEchoDeck.generate('quarters', 'beginner', Math.random);
    const score = rhythmEchoDeck.check(item, '0,1.02,1.98,3.05');
    expect(score.correct).toBe(true);
    expect(score.accuracy).toBe(1);
  });

  it('gives partial credit (a shaky pass) when some onsets land and some miss', () => {
    const item = rhythmEchoDeck.generate('quarters', 'beginner', Math.random);
    // 3 of 4 in time → 0.75 → passes but is partial (server maps 0.5–1 to quality 3).
    const score = rhythmEchoDeck.check(item, '0,1,2');
    expect(score.accuracy).toBe(0.75);
    expect(score.correct).toBe(true);
    expect(score.detail).toBe('3/4');
  });

  it('fails a performance that misses most onsets', () => {
    const item = rhythmEchoDeck.generate('quarters', 'beginner', Math.random);
    const score = rhythmEchoDeck.check(item, '0');
    expect(score.accuracy).toBe(0.25);
    expect(score.correct).toBe(false);
  });
});
