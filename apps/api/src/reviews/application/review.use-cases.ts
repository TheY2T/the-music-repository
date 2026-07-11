import { Injectable } from '@nestjs/common';
import { applySm2, defaultReviewState, type ReviewState } from '../domain/sm2';
import { currentStreakDays } from '../domain/streak';
import {
  ReviewRepository,
  type ReviewSummaryView,
  type StoredCard,
} from './ports/review-repository.port';

@Injectable()
export class GetReviewSummaryUseCase {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(userId: string): Promise<ReviewSummaryView> {
    const now = new Date();
    const [decks, dateKeys, reviewsToday] = await Promise.all([
      this.reviews.summary(userId, now),
      this.reviews.activityDateKeys(userId),
      this.reviews.reviewsToday(userId, now),
    ]);
    return {
      decks,
      totalDue: decks.reduce((sum, d) => sum + d.due, 0),
      reviewsToday,
      streakDays: currentStreakDays(dateKeys, now),
    };
  }
}

@Injectable()
export class GetDeckReviewsUseCase {
  constructor(private readonly reviews: ReviewRepository) {}
  execute(userId: string, deck: string): Promise<StoredCard[]> {
    return this.reviews.listDeck(userId, deck);
  }
}

@Injectable()
export class GradeCardUseCase {
  constructor(private readonly reviews: ReviewRepository) {}

  async execute(userId: string, deck: string, card: string, quality: number): Promise<ReviewState> {
    const now = new Date();
    const current = (await this.reviews.get(userId, deck, card)) ?? defaultReviewState(now);
    const next = applySm2(current, quality, now);
    await this.reviews.save(userId, deck, card, next);
    await this.reviews.recordReview(userId, now);
    return next;
  }
}
