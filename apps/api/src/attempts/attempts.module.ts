import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { GetDeckMasteryUseCase, GetDrillStatsUseCase } from './application/drill-stats.use-cases';
import { AttemptLog } from './application/ports/attempt-log';
import { RecordDrillAttemptUseCase } from './application/record-drill-attempt.use-case';
import { AttemptsController } from './attempts.controller';
import { DrizzleAttemptLog } from './infrastructure/drizzle-attempt-log';

/**
 * Drill engine attempts feature (hexagonal). Imports AuthModule for `CurrentUser` and ReviewsModule to
 * reuse `GradeCardUseCase` (SM-2 scheduling + streak logging stay single-sourced in the reviews context).
 */
@Module({
  imports: [AuthModule, ReviewsModule],
  controllers: [AttemptsController],
  providers: [
    RecordDrillAttemptUseCase,
    GetDrillStatsUseCase,
    GetDeckMasteryUseCase,
    { provide: AttemptLog, useClass: DrizzleAttemptLog },
  ],
})
export class AttemptsModule {}
