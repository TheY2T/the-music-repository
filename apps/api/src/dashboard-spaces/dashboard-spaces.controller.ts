import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { GetDashboardSpacesUseCase } from './application/use-cases/get-dashboard-spaces.use-case';
import { UpdateDashboardSpacesUseCase } from './application/use-cases/update-dashboard-spaces.use-case';
import type { DashboardSpace, StoredDashboardSpaces } from './domain/dashboard-space';
import { UpdateDashboardSpacesDto } from './dto/dashboard-spaces.dto';

/**
 * Personalization — the acting user's customizable practice-space dashboard. Every route requires
 * authentication (the user id comes from the `CurrentUser` port) and is gated on the
 * `personalization.dashboard-spaces` flag via **method-level** `@RequireFlagsEnabled` (class-level drops
 * route mapping — see api CLAUDE.md).
 */
@Controller()
export class DashboardSpacesController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly getSpaces: GetDashboardSpacesUseCase,
    private readonly updateSpaces: UpdateDashboardSpacesUseCase,
  ) {}

  @Get('me/dashboard-spaces')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.DashboardSpaces }] })
  @RequireAuth()
  async get() {
    return toView(await this.getSpaces.execute(this.currentUser.require().id));
  }

  @Put('me/dashboard-spaces')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.DashboardSpaces }] })
  @RequireAuth()
  async update(@Body() body: UpdateDashboardSpacesDto) {
    const stored = await this.updateSpaces.execute(this.currentUser.require().id, {
      spaces: toDomainSpaces(body.spaces),
      activeSpaceId: body.activeSpaceId,
    });
    return toView(stored);
  }
}

function toDomainSpaces(spaces: UpdateDashboardSpacesDto['spaces']): DashboardSpace[] {
  return spaces.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    background: s.background,
    widgets: s.widgets.map((w) => ({
      id: w.id,
      type: w.type,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      config: w.config as Record<string, unknown>,
    })),
  }));
}

function toView(s: StoredDashboardSpaces) {
  return {
    spaces: s.spaces,
    activeSpaceId: s.activeSpaceId,
    updatedAt: s.updatedAt.toISOString(),
  };
}
