import { describe, expect, it } from 'vitest';
import type { StoredAchievements } from '../../domain/achievements';
import type { LearnerAchievements } from '../ports/learner-achievements.port';
import { GetAchievementsUseCase } from './get-achievements.use-case';

const unusedPut: LearnerAchievements['put'] = () => {
  throw new Error('put should not be called');
};

describe('GetAchievementsUseCase', () => {
  it('returns zero XP + no badges when the user has never saved', async () => {
    const port: LearnerAchievements = { get: async () => null, put: unusedPut };
    const result = await new GetAchievementsUseCase(port).execute('user-1');
    expect(result).toMatchObject({ xp: 0, badges: [] });
    expect(result.updatedAt).toEqual(new Date(0));
  });

  it('returns the stored achievements when present', async () => {
    const stored: StoredAchievements = {
      xp: 350,
      badges: ['first-steps'],
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const port: LearnerAchievements = { get: async () => stored, put: unusedPut };
    expect(await new GetAchievementsUseCase(port).execute('user-1')).toBe(stored);
  });
});
