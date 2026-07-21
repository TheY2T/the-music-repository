import { Injectable } from '@nestjs/common';
import type { Achievements, StoredAchievements } from '../../domain/achievements';
import { LearnerAchievements } from '../ports/learner-achievements.port';

@Injectable()
export class UpdateAchievementsUseCase {
  constructor(private readonly achievements: LearnerAchievements) {}

  execute(userId: string, achievements: Achievements): Promise<StoredAchievements> {
    return this.achievements.put(userId, achievements);
  }
}
