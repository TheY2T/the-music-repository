import { describe, expect, it } from 'vitest';
import { applySm2, defaultReviewState } from './sm2';

const NOW = new Date('2026-07-18T00:00:00.000Z');
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

describe('defaultReviewState', () => {
  it('is due now with the standard 2.5 ease and no history', () => {
    const s = defaultReviewState(NOW);
    expect(s).toEqual({ easeFactor: 2.5, intervalDays: 0, repetitions: 0, dueAt: NOW });
  });
});

describe('applySm2', () => {
  it('lapses a card on a failing grade (< 3): resets reps, due tomorrow', () => {
    const s = applySm2({ easeFactor: 2.5, intervalDays: 6, repetitions: 3, dueAt: NOW }, 2, NOW);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    expect(daysBetween(NOW, s.dueAt)).toBe(1);
  });

  it('advances the interval 1 → 6 → previous × ease on passing grades', () => {
    const first = applySm2(defaultReviewState(NOW), 4, NOW);
    expect(first.repetitions).toBe(1);
    expect(first.intervalDays).toBe(1);

    const second = applySm2(first, 4, NOW);
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(6);

    const third = applySm2(second, 4, NOW);
    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(Math.round(6 * second.easeFactor));
  });

  it('handles the partial-pass quality 3 (a path the old manual UI never produced)', () => {
    const s = applySm2(defaultReviewState(NOW), 3, NOW);
    expect(s.repetitions).toBe(1);
    expect(s.intervalDays).toBe(1);
    expect(s.dueAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('raises ease on Easy (5) and never drops below the 1.3 floor', () => {
    const easy = applySm2(defaultReviewState(NOW), 5, NOW);
    expect(easy.easeFactor).toBeGreaterThan(2.5);

    let s = defaultReviewState(NOW);
    for (let i = 0; i < 10; i += 1) {
      s = applySm2(s, 3, NOW);
    }
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('clamps quality into 0–5', () => {
    expect(() => applySm2(defaultReviewState(NOW), 99, NOW)).not.toThrow();
    expect(applySm2(defaultReviewState(NOW), 99, NOW).repetitions).toBe(1);
    expect(applySm2(defaultReviewState(NOW), -5, NOW).repetitions).toBe(0);
  });
});
