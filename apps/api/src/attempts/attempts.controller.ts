import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import type { ReviewState } from '../reviews/domain/sm2';
import { GetDeckMasteryUseCase, GetDrillStatsUseCase } from './application/drill-stats.use-cases';
import { RecordDrillAttemptUseCase } from './application/record-drill-attempt.use-case';
import { RecordDrillAttemptDto } from './dto/attempts.dto';

function toWire(card: string, state: ReviewState) {
  return {
    card,
    easeFactor: state.easeFactor,
    intervalDays: state.intervalDays,
    repetitions: state.repetitions,
    dueAt: state.dueAt.toISOString(),
  };
}

/**
 * Drill engine attempts — objective grading + per-skill mastery. Every route requires authentication
 * and the drill engine flag (method-level so the class still maps when the flag is off, per ADR 0009).
 */
@Controller()
export class AttemptsController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly recordAttempt: RecordDrillAttemptUseCase,
    private readonly getStats: GetDrillStatsUseCase,
    private readonly getDeckMastery: GetDeckMasteryUseCase,
  ) {}

  @Post('me/drills/attempts')
  @HttpCode(201)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.DrillEngine }] })
  @RequireAuth()
  async record(@Body() body: RecordDrillAttemptDto) {
    const { state, quality, isPersonalBest } = await this.recordAttempt.execute(
      this.currentUser.require().id,
      {
        deck: body.deck,
        card: body.card,
        modality: body.modality,
        accuracy: body.accuracy,
        correct: body.correct,
        responseMs: body.responseMs,
      },
    );
    return { state: toWire(body.card, state), quality, isPersonalBest };
  }

  @Get('me/drills/stats')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.DrillEngine }] })
  @RequireAuth()
  stats() {
    return this.getStats.execute(this.currentUser.require().id);
  }

  @Get('me/drills/stats/:deck')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.DrillEngine }] })
  @RequireAuth()
  deckMastery(@Param('deck') deck: string) {
    return this.getDeckMastery.execute(this.currentUser.require().id, deck);
  }
}
