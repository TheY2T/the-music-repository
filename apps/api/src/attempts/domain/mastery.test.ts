import { describe, expect, it } from 'vitest';
import { masteryScore, masteryToLevel, summarizeDeck } from './mastery';

const hit = { correct: true, accuracy: 1 };
const miss = { correct: false, accuracy: 0 };

describe('masteryScore (EWMA)', () => {
  it('is 0 for no attempts', () => {
    expect(masteryScore([])).toBe(0);
  });

  it('equals the single accuracy for one attempt', () => {
    expect(masteryScore([hit])).toBe(1);
    expect(masteryScore([miss])).toBe(0);
  });

  it('weights recent attempts more (a late miss drags it down)', () => {
    const trending = masteryScore([hit, hit, hit, miss]);
    expect(trending).toBeLessThan(1);
    expect(trending).toBeGreaterThan(0);
  });
});

describe('masteryToLevel', () => {
  it('gates advancement on accuracy thresholds', () => {
    expect(masteryToLevel(0.2)).toBe('beginner');
    expect(masteryToLevel(0.75)).toBe('intermediate');
    expect(masteryToLevel(0.9)).toBe('advanced');
    expect(masteryToLevel(0.97)).toBe('expert');
  });
});

describe('summarizeDeck', () => {
  it('reports attempts, mean accuracy, mastery and level', () => {
    const s = summarizeDeck('intervals', [hit, hit, hit, hit]);
    expect(s.deck).toBe('intervals');
    expect(s.attempts).toBe(4);
    expect(s.accuracy).toBe(1);
    expect(s.mastery).toBe(1);
    expect(s.level).toBe('expert');
  });

  it('handles an empty deck', () => {
    const s = summarizeDeck('staff-notes', []);
    expect(s.attempts).toBe(0);
    expect(s.accuracy).toBe(0);
    expect(s.level).toBe('beginner');
  });
});
