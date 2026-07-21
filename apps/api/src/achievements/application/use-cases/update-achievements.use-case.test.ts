import { describe, expect, it } from 'vitest';
import type { Achievements } from '../../domain/achievements';
import type { LearnerAchievements } from '../ports/learner-achievements.port';
import { UpdateAchievementsUseCase } from './update-achievements.use-case';

describe('UpdateAchievementsUseCase', () => {
  it('delegates the upsert to the port and returns the stored record', async () => {
    const input: Achievements = { xp: 500, badges: ['first-steps', 'week-streak'] };
    const calls: { userId: string; data: Achievements }[] = [];
    const port: LearnerAchievements = {
      get: async () => null,
      put: async (userId, data) => {
        calls.push({ userId, data });
        return { ...data, updatedAt: new Date('2026-02-02T00:00:00.000Z') };
      },
    };

    const result = await new UpdateAchievementsUseCase(port).execute('user-9', input);

    expect(calls).toEqual([{ userId: 'user-9', data: input }]);
    expect(result.xp).toBe(500);
    expect(result.badges).toEqual(['first-steps', 'week-streak']);
  });
});
