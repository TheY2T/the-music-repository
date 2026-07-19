import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import {
  DismissNpsUseCase,
  NpsEligibilityUseCase,
  SubmitNpsUseCase,
} from './application/nps.use-cases';
import { SubmitNpsDto } from './dto/feedback.dto';

/** In-app Net Promoter Score prompt for signed-in users. */
@Controller('feedback/nps')
export class NpsController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly eligibility: NpsEligibilityUseCase,
    private readonly submitNps: SubmitNpsUseCase,
    private readonly dismissNps: DismissNpsUseCase,
  ) {}

  @Get('eligibility')
  @RequireAuth()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackNps }] })
  async getEligibility() {
    const user = this.currentUser.require();
    return { eligible: await this.eligibility.execute(user.id, user.roles) };
  }

  @Post()
  @HttpCode(201)
  @RequireAuth()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackNps }] })
  async submit(@Body() body: SubmitNpsDto) {
    await this.submitNps.execute(
      this.currentUser.require().id,
      body.score,
      body.comment ?? null,
      body.source ?? null,
    );
    return { recorded: true };
  }

  @Post('dismiss')
  @HttpCode(204)
  @RequireAuth()
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.FeedbackNps }] })
  dismiss() {
    return this.dismissNps.execute(this.currentUser.require().id);
  }
}
