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
})
export class ReviewsModule {}
