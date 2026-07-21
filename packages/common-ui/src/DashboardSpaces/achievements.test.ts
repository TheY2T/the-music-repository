import { describe, expect, it } from 'vitest';
import {
  computeAchievements,
  detectCelebration,
  levelForXp,
  levelProgress,
  XP_PER_LEVEL,
  xpFor,
} from './achievements';

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

  it('detects a level-up vs the previously-persisted standing', () => {
    const next = computeAchievements({ completedCount: 0, streakDays: 0, practiceMinutes: 300 }); // 600 XP → level 2
    const c = detectCelebration({ xp: 400, badges: ['hour-practiced'] }, next); // was level 1
    expect(levelForXp(400)).toBe(1);
    expect(c.leveledUp).toBe(true);
    expect(c.celebrate).toBe(true);
  });

  it('detects a newly-unlocked badge', () => {
    const next = computeAchievements({ completedCount: 10, streakDays: 0, practiceMinutes: 0 });
    const c = detectCelebration({ xp: next.xp, badges: ['first-steps'] }, next);
    expect(c.newBadges).toContain('ten-done');
    expect(c.celebrate).toBe(true);
  });

  it('never celebrates on the first-ever sync (no prior persisted standing)', () => {
    const next = computeAchievements({ completedCount: 20, streakDays: 30, practiceMinutes: 1000 });
    expect(detectCelebration(null, next).celebrate).toBe(false);
  });

  it('does not celebrate when nothing changed', () => {
    const next = computeAchievements({ completedCount: 3, streakDays: 2, practiceMinutes: 90 });
    expect(detectCelebration({ xp: next.xp, badges: next.badges }, next).celebrate).toBe(false);
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
