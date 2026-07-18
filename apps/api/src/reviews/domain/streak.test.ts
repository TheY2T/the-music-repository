import { describe, expect, it } from 'vitest';
import { currentStreakDays, toDateKey } from './streak';

const TODAY = new Date('2026-07-18T12:00:00.000Z');
const key = (offsetDays: number) => {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return toDateKey(d);
};

describe('toDateKey', () => {
  it('is the UTC YYYY-MM-DD portion', () => {
    expect(toDateKey(TODAY)).toBe('2026-07-18');
  });
});

describe('currentStreakDays', () => {
  it('is 0 with no activity', () => {
    expect(currentStreakDays([], TODAY)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(currentStreakDays([key(0), key(1), key(2)], TODAY)).toBe(3);
  });

  it('allows a one-day grace (yesterday counts even if today is empty)', () => {
    expect(currentStreakDays([key(1), key(2)], TODAY)).toBe(2);
  });

  it('breaks the streak on a two-day gap', () => {
    expect(currentStreakDays([key(2), key(3)], TODAY)).toBe(0);
  });

  it('ignores duplicate activity on the same day', () => {
    expect(currentStreakDays([key(0), key(0), key(1)], TODAY)).toBe(2);
  });
});
