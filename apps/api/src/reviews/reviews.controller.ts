import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import {
  GetDeckReviewsUseCase,
  GetReviewSummaryUseCase,
  GradeCardUseCase,
} from './application/review.use-cases';
import type { ReviewState } from './domain/sm2';
import { GradeCardDto } from './dto/reviews.dto';

function toWire(card: string, state: ReviewState) {
  return {
    card,
    easeFactor: state.easeFactor,
    intervalDays: state.intervalDays,
    repetitions: state.repetitions,
    dueAt: state.dueAt.toISOString(),
  };
}

/** Per-user SRS review state. Every route requires authentication. */
@Controller()
export class ReviewsController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly getSummary: GetReviewSummaryUseCase,
    private readonly getDeck: GetDeckReviewsUseCase,
    private readonly gradeCard: GradeCardUseCase,
  ) {}

  @Get('me/reviews')
  @RequireAuth()
  summary() {
    return this.getSummary.execute(this.currentUser.require().id);
  }

  @Get('me/reviews/:deck')
  @RequireAuth()
  async deck(@Param('deck') deck: string) {
    const cards = await this.getDeck.execute(this.currentUser.require().id, deck);
    return {
      cards: cards.map((c) => toWire(c.card, c)),
    };
  }

  @Post('me/reviews/:deck/:card')
  @HttpCode(201)
  @RequireAuth()
  async grade(
    @Param('deck') deck: string,
    @Param('card') card: string,
    @Body() body: GradeCardDto,
  ) {
    const state = await this.gradeCard.execute(
      this.currentUser.require().id,
      deck,
      card,
      body.quality,
    );
    return toWire(card, state);
  }
}
