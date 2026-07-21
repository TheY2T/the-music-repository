import { Injectable } from '@nestjs/common';
import { EMPTY_ACHIEVEMENTS, type StoredAchievements } from '../../domain/achievements';
import { LearnerAchievements } from '../ports/learner-achievements.port';

@Injectable()
export class GetAchievementsUseCase {
  constructor(private readonly achievements: LearnerAchievements) {}

  /** The user's saved achievements, falling back to zero XP + no badges when none exist. */
  async execute(userId: string): Promise<StoredAchievements> {
    const stored = await this.achievements.get(userId);
    return stored ?? { ...EMPTY_ACHIEVEMENTS, updatedAt: new Date(0) };
  }
}
