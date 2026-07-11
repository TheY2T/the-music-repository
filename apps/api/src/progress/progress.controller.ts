import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { GetProgressSummaryUseCase } from './application/use-cases/get-progress-summary.use-case';
import {
  LogPracticeUseCase,
  MarkCompleteUseCase,
  MarkIncompleteUseCase,
} from './application/use-cases/mark-progress.use-case';
import { LogPracticeDto } from './dto/progress.dto';

/** Per-user progress — completion + practice. Every route requires authentication. */
@Controller()
export class ProgressController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly getSummary: GetProgressSummaryUseCase,
    private readonly markComplete: MarkCompleteUseCase,
    private readonly markIncomplete: MarkIncompleteUseCase,
    private readonly logPractice: LogPracticeUseCase,
  ) {}

  @Get('me/progress')
  @RequireAuth()
  summary() {
    return this.getSummary.execute(this.currentUser.require().id);
  }

  @Post('me/progress/:slug')
  @HttpCode(204)
  @RequireAuth()
  complete(@Param('slug') slug: string) {
    return this.markComplete.execute(this.currentUser.require().id, slug);
  }

  @Delete('me/progress/:slug')
  @HttpCode(204)
  @RequireAuth()
  incomplete(@Param('slug') slug: string) {
    return this.markIncomplete.execute(this.currentUser.require().id, slug);
  }

  @Post('me/practice')
  @HttpCode(201)
  @RequireAuth()
  async practice(@Body() body: LogPracticeDto) {
    const userId = this.currentUser.require().id;
    await this.logPractice.execute(userId, body.contentSlug ?? null, body.minutes);
    return this.getSummary.execute(userId);
  }
}
