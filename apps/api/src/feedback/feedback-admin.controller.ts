import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Query } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  DeleteFeedbackUseCase,
  GetFeedbackUseCase,
  ListFeedbackUseCase,
  UpdateFeedbackUseCase,
} from './application/admin-feedback.use-cases';
import { ListNpsResponsesUseCase, NpsAnalyticsUseCase } from './application/nps.use-cases';
import type { FeedbackStatus, FeedbackType } from './domain/feedback-submission';
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from './domain/feedback-submission';
import { UpdateFeedbackDto } from './dto/feedback.dto';

function toInt(value: string | undefined, fallback: number): number {
  const parsed = value != null ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Admin triage + NPS analytics. RBAC-gated on the `feedback` resource. */
@Controller('admin/feedback')
export class FeedbackAdminController {
  constructor(
    private readonly listFeedback: ListFeedbackUseCase,
    private readonly getFeedback: GetFeedbackUseCase,
    private readonly updateFeedback: UpdateFeedbackUseCase,
    private readonly deleteFeedback: DeleteFeedbackUseCase,
    private readonly listNps: ListNpsResponsesUseCase,
    private readonly npsAnalytics: NpsAnalyticsUseCase,
  ) {}

  @Get()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackForm }] })
  @RequirePermissions({ feedback: ['read'] })
  list(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listFeedback.execute({
      type: FEEDBACK_TYPES.includes(type as FeedbackType) ? (type as FeedbackType) : undefined,
      status: FEEDBACK_STATUSES.includes(status as FeedbackStatus)
        ? (status as FeedbackStatus)
        : undefined,
      page: Math.max(1, toInt(page, 1)),
      pageSize: Math.min(200, Math.max(1, toInt(pageSize, 25))),
    });
  }

  @Get('nps')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackNps }] })
  @RequirePermissions({ feedback: ['read'] })
  npsResponses(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.listNps.execute(
      Math.max(1, toInt(page, 1)),
      Math.min(200, Math.max(1, toInt(pageSize, 25))),
    );
  }

  @Get('nps/analytics')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackNps }] })
  @RequirePermissions({ feedback: ['read'] })
  analytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.npsAnalytics.execute(toDate(from), toDate(to));
  }

  @Get(':id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackForm }] })
  @RequirePermissions({ feedback: ['read'] })
  get(@Param('id') id: string) {
    return this.getFeedback.execute(id);
  }

  @Patch(':id')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackForm }] })
  @RequirePermissions({ feedback: ['update'] })
  update(@Param('id') id: string, @Body() body: UpdateFeedbackDto) {
    return this.updateFeedback.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackForm }] })
  @RequirePermissions({ feedback: ['delete'] })
  remove(@Param('id') id: string) {
    return this.deleteFeedback.execute(id);
  }
}
