/** A user's gamification standing (domain entity — framework-free). */
export interface Achievements {
  xp: number;
  badges: string[];
}

/** A stored achievements record with its last-updated time. */
export interface StoredAchievements extends Achievements {
  updatedAt: Date;
}

/** The values a user starts with: no XP and no badges. */
export const EMPTY_ACHIEVEMENTS: Achievements = { xp: 0, badges: [] };
