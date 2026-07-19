import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  DeleteFeedbackUseCase,
  GetFeedbackUseCase,
  ListFeedbackUseCase,
  UpdateFeedbackUseCase,
} from './application/admin-feedback.use-cases';
import {
  ListBoardUseCase,
  UnvoteFeedbackUseCase,
  VoteFeedbackUseCase,
} from './application/board.use-cases';
import {
  DismissNpsUseCase,
  ListNpsResponsesUseCase,
  NpsAnalyticsUseCase,
  NpsEligibilityUseCase,
  SubmitNpsUseCase,
} from './application/nps.use-cases';
import { FeedbackRepository } from './application/ports/feedback-repository.port';
import { NpsRepository } from './application/ports/nps-repository.port';
import { SubmitFeedbackUseCase } from './application/submit-feedback.use-case';
import { FeedbackController } from './feedback.controller';
import { FeedbackAdminController } from './feedback-admin.controller';
import { DrizzleFeedbackRepository } from './infrastructure/drizzle-feedback.repository';
import { DrizzleNpsRepository } from './infrastructure/drizzle-nps.repository';
import { NpsController } from './nps.controller';

/**
 * Feedback & NPS feature (hexagonal). User-submitted suggestions/bugs/praise + a Net Promoter Score
 * programme, with an admin triage + analytics surface. Imports AuthModule for the `CurrentUser` port.
 */
@Module({
  imports: [AuthModule],
  controllers: [FeedbackController, NpsController, FeedbackAdminController],
  providers: [
    SubmitFeedbackUseCase,
    ListFeedbackUseCase,
    GetFeedbackUseCase,
    UpdateFeedbackUseCase,
    DeleteFeedbackUseCase,
    ListBoardUseCase,
    VoteFeedbackUseCase,
    UnvoteFeedbackUseCase,
    NpsEligibilityUseCase,
    SubmitNpsUseCase,
    DismissNpsUseCase,
    ListNpsResponsesUseCase,
    NpsAnalyticsUseCase,
    { provide: FeedbackRepository, useClass: DrizzleFeedbackRepository },
    { provide: NpsRepository, useClass: DrizzleNpsRepository },
  ],
})
export class FeedbackModule {}
