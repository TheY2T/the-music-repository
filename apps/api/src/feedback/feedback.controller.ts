import { FlagDefaults, FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { OpenFeatureClient, RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import type { Client } from '@openfeature/server-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth, ResolveOptionalAuth } from '../auth/require-permissions.decorator';
import {
  ListBoardUseCase,
  UnvoteFeedbackUseCase,
  VoteFeedbackUseCase,
} from './application/board.use-cases';
import { SubmitFeedbackUseCase } from './application/submit-feedback.use-case';
import { SubmitFeedbackDto } from './dto/feedback.dto';

function toInt(value: string | undefined, fallback: number): number {
  const parsed = value != null ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** User-facing feedback surface: submit a suggestion/bug/praise, and the public /roadmap board. */
@Controller('feedback')
export class FeedbackController {
  constructor(
    @OpenFeatureClient() private readonly flags: Client,
    private readonly currentUser: CurrentUser,
    private readonly submitFeedback: SubmitFeedbackUseCase,
    private readonly listBoard: ListBoardUseCase,
    private readonly voteFeedback: VoteFeedbackUseCase,
    private readonly unvoteFeedback: UnvoteFeedbackUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @RequireAuth()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackForm }] })
  async submit(@Body() body: SubmitFeedbackDto) {
    const bugReportsEnabled = await this.flags.getBooleanValue(
      FlagKeys.FeedbackBugs,
      FlagDefaults[FlagKeys.FeedbackBugs],
    );
    return this.submitFeedback.execute(body, {
      userId: this.currentUser.require().id,
      locale: null,
      bugReportsEnabled,
    });
  }

  @Get('board')
  @ResolveOptionalAuth()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackBoard }] })
  board(
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listBoard.execute({
      sort: sort === 'new' ? 'new' : 'top',
      page: Math.max(1, toInt(page, 1)),
      pageSize: Math.min(100, Math.max(1, toInt(pageSize, 25))),
      viewerId: this.currentUser.optional()?.id ?? null,
    });
  }

  @Post(':id/vote')
  @RequireAuth()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackBoard }] })
  vote(@Param('id') id: string) {
    return this.voteFeedback.execute(id, this.currentUser.require().id);
  }

  @Delete(':id/vote')
  @RequireAuth()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackBoard }] })
  unvote(@Param('id') id: string) {
    return this.unvoteFeedback.execute(id, this.currentUser.require().id);
  }
}
