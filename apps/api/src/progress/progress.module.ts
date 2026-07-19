import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectionsModule } from '../collections/collections.module';
import { ProgressRepository } from './application/ports/progress-repository.port';
import { GetProgressSummaryUseCase } from './application/use-cases/get-progress-summary.use-case';
import {
  LogPracticeUseCase,
  MarkCompleteUseCase,
  MarkIncompleteUseCase,
} from './application/use-cases/mark-progress.use-case';
import { DrizzleProgressRepository } from './infrastructure/drizzle-progress.repository';
import { ProgressController } from './progress.controller';

/**
 * Progress feature (hexagonal). Imports AuthModule for the `CurrentUser` port and
 * CollectionsModule for `CollectionRepository` (per-collection completion).
 */
@Module({
  imports: [AuthModule, CollectionsModule],
  controllers: [ProgressController],
  providers: [
    GetProgressSummaryUseCase,
    MarkCompleteUseCase,
    MarkIncompleteUseCase,
    LogPracticeUseCase,
    { provide: ProgressRepository, useClass: DrizzleProgressRepository },
  ],
})
export class ProgressModule {}
