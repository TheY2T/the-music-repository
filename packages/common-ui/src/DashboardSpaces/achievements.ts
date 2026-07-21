import type { IconName } from '@TheY2T/tmr-ui';

/** The activity signals XP + badges are derived from (mapped from the progress summary). */
export interface AchievementInputs {
  completedCount: number;
  streakDays: number;
  practiceMinutes: number;
}

/** A learner's derived standing. */
export interface AchievementState {
  xp: number;
  level: number;
  badges: string[];
}

/** XP per level — a level is earned every `XP_PER_LEVEL` points. */
export const XP_PER_LEVEL = 500;

/** A badge definition: its unlock rule + how to label/icon it. `key` is stored; names are i18n keys. */
export interface BadgeDef {
  key: string;
  nameKey: string;
  icon: IconName;
  test: (i: AchievementInputs) => boolean;
}

/** The badge catalogue, ordered from easiest to hardest. */
export const BADGES: BadgeDef[] = [
  {
    key: 'first-steps',
    nameKey: 'spaces.badge.firstSteps',
    icon: 'sparkles',
    test: (i) => i.completedCount >= 1,
  },
  {
    key: 'ten-done',
    nameKey: 'spaces.badge.tenDone',
    icon: 'circle-check',
    test: (i) => i.completedCount >= 10,
  },
  {
    key: 'week-streak',
    nameKey: 'spaces.badge.weekStreak',
    icon: 'flame',
    test: (i) => i.streakDays >= 7,
  },
  {
    key: 'month-streak',
    nameKey: 'spaces.badge.monthStreak',
    icon: 'trophy',
    test: (i) => i.streakDays >= 30,
  },
  {
    key: 'hour-practiced',
    nameKey: 'spaces.badge.hourPracticed',
    icon: 'clock',
    test: (i) => i.practiceMinutes >= 60,
  },
  {
    key: 'ten-hours',
    nameKey: 'spaces.badge.tenHours',
    icon: 'medal',
    test: (i) => i.practiceMinutes >= 600,
  },
];

/** XP earned from activity: finishing items, minutes at the instrument, and streak days. */
export function xpFor(i: AchievementInputs): number {
  return i.completedCount * 50 + i.practiceMinutes * 2 + i.streakDays * 20;
}

/** The level a given XP total sits at (1-based). */
export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** Derive a learner's XP, level, and unlocked badge keys from their activity. Pure. */
export function computeAchievements(i: AchievementInputs): AchievementState {
  const xp = xpFor(i);
  return {
    xp,
    level: levelForXp(xp),
    badges: BADGES.filter((b) => b.test(i)).map((b) => b.key),
  };
}

/** XP progress within the current level, 0–1 (for a level-progress bar). */
export function levelProgress(xp: number): number {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
}

/** What (if anything) to celebrate given the previously-persisted standing and the new one. */
export interface Celebration {
  leveledUp: boolean;
  newBadges: string[];
  celebrate: boolean;
}

/**
 * Compare the previously-persisted achievements to the freshly-derived ones. Returns whether the learner
 * levelled up or unlocked new badges. `prev` is `null` on the first-ever sync (nothing persisted yet), so
 * a learner with pre-existing activity isn't greeted by a false celebration on their first visit.
 */
export function detectCelebration(
  prev: { xp: number; badges: string[] } | null,
  next: AchievementState,
): Celebration {
  if (!prev) return { leveledUp: false, newBadges: [], celebrate: false };
  const leveledUp = next.level > levelForXp(prev.xp);
  const newBadges = next.badges.filter((b) => !prev.badges.includes(b));
  return { leveledUp, newBadges, celebrate: leveledUp || newBadges.length > 0 };
}
