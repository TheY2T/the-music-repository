import { describe, expect, it } from 'vitest';
import { computeAchievements, levelProgress, XP_PER_LEVEL, xpFor } from './achievements';

describe('achievements derivation', () => {
  it('gives zero XP, level 1, and no badges for no activity', () => {
    expect(computeAchievements({ completedCount: 0, streakDays: 0, practiceMinutes: 0 })).toEqual({
      xp: 0,
      level: 1,
      badges: [],
    });
  });

  it('derives XP from completion, practice minutes, and streak days', () => {
    // 2×50 + 10×2 + 3×20 = 180
    expect(xpFor({ completedCount: 2, streakDays: 3, practiceMinutes: 10 })).toBe(180);
  });

  it('unlocks the badges whose thresholds are met (and not others)', () => {
    const { badges } = computeAchievements({
      completedCount: 10,
      streakDays: 7,
      practiceMinutes: 600,
    });
    expect(badges).toEqual(
      expect.arrayContaining([
        'first-steps',
        'ten-done',
        'week-streak',
        'hour-practiced',
        'ten-hours',
      ]),
    );
    expect(badges).not.toContain('month-streak');
  });

  it('levels up every XP_PER_LEVEL points', () => {
    const state = computeAchievements({
      completedCount: 0,
      streakDays: 0,
      practiceMinutes: XP_PER_LEVEL / 2, // ×2 XP per minute → exactly one level's worth
    });
    expect(state.xp).toBe(XP_PER_LEVEL);
    expect(state.level).toBe(2);
    expect(levelProgress(XP_PER_LEVEL)).toBe(0);
  });
});
