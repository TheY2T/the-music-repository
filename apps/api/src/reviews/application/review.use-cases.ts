import { Injectable } from '@nestjs/common';
import { applySm2, defaultReviewState, type ReviewState } from '../domain/sm2';
import { type DeckCount, ReviewRepository, type StoredCard } from './ports/review-repository.port';

@Injectable()
export class GetReviewSummaryUseCase {
  constructor(private readonly reviews: ReviewRepository) {}
  execute(userId: string): Promise<DeckCount[]> {
    return this.reviews.summary(userId, new Date());
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
    return next;
  }
}
