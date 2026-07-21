import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AchievementsController } from './achievements.controller';
import { LearnerAchievements } from './application/ports/learner-achievements.port';
import { GetAchievementsUseCase } from './application/use-cases/get-achievements.use-case';
import { UpdateAchievementsUseCase } from './application/use-cases/update-achievements.use-case';
import { DrizzleLearnerAchievements } from './infrastructure/drizzle-learner-achievements.repository';

/**
 * Achievements feature (hexagonal). Imports AuthModule for the `CurrentUser` port. Binds the
 * `LearnerAchievements` port to its Drizzle adapter.
 */
@Module({
  imports: [AuthModule],
  controllers: [AchievementsController],
  providers: [
    GetAchievementsUseCase,
    UpdateAchievementsUseCase,
    { provide: LearnerAchievements, useClass: DrizzleLearnerAchievements },
  ],
})
export class AchievementsModule {}
