import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { GetAchievementsUseCase } from './application/use-cases/get-achievements.use-case';
import { UpdateAchievementsUseCase } from './application/use-cases/update-achievements.use-case';
import type { StoredAchievements } from './domain/achievements';
import { UpdateAchievementsDto } from './dto/achievements.dto';

/**
 * Gamification — the acting user's XP + unlocked badges. Every route requires authentication (the user
 * id comes from the `CurrentUser` port) and is gated on the `learning.achievements` flag via
 * **method-level** `@RequireFlagsEnabled` (class-level drops route mapping — see api CLAUDE.md).
 */
@Controller()
export class AchievementsController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly getAchievements: GetAchievementsUseCase,
    private readonly updateAchievements: UpdateAchievementsUseCase,
  ) {}

  @Get('me/achievements')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Achievements }] })
  @RequireAuth()
  async get() {
    return toView(await this.getAchievements.execute(this.currentUser.require().id));
  }

  @Put('me/achievements')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Achievements }] })
  @RequireAuth()
  async update(@Body() body: UpdateAchievementsDto) {
    const stored = await this.updateAchievements.execute(this.currentUser.require().id, {
      xp: body.xp,
      badges: body.badges,
    });
    return toView(stored);
  }
}

function toView(a: StoredAchievements) {
  return { xp: a.xp, badges: a.badges, updatedAt: a.updatedAt.toISOString() };
}
