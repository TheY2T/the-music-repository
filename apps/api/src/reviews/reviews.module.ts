import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReviewRepository } from './application/ports/review-repository.port';
import {
  GetDeckReviewsUseCase,
  GetReviewSummaryUseCase,
  GradeCardUseCase,
} from './application/review.use-cases';
import { DrizzleReviewRepository } from './infrastructure/drizzle-review.repository';
import { ReviewsController } from './reviews.controller';

/** Trainers / SRS reviews feature (Phase 4, hexagonal). Imports AuthModule for `CurrentUser`. */
@Module({
  imports: [AuthModule],
  controllers: [ReviewsController],
  providers: [
    GetReviewSummaryUseCase,
    GetDeckReviewsUseCase,
    GradeCardUseCase,
    { provide: ReviewRepository, useClass: DrizzleReviewRepository },
  ],
  // GradeCardUseCase is reused by the attempts context (objective grading delegates SM-2 to reviews).
  exports: [GradeCardUseCase],
})
export class ReviewsModule {}
