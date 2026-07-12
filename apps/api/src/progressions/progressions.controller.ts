import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { DeleteProgressionUseCase } from './application/use-cases/delete-progression.use-case';
import { ListProgressionsUseCase } from './application/use-cases/list-progressions.use-case';
import { SaveProgressionUseCase } from './application/use-cases/save-progression.use-case';
import type { SavedProgression } from './domain/saved-progression';
import { SaveProgressionDto } from './dto/progressions.dto';

/**
 * Personalization — the acting user's saved chord progressions. Every route requires authentication
 * (the user id comes from the `CurrentUser` port) and is gated on the `personalization.saved-progressions`
 * flag via **method-level** `@RequireFlagsEnabled` (class-level drops route mapping — see api CLAUDE.md).
 * The client keeps a localStorage copy for anonymous use.
 */
@Controller()
export class ProgressionsController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly listProgressions: ListProgressionsUseCase,
    private readonly saveProgression: SaveProgressionUseCase,
    private readonly deleteProgression: DeleteProgressionUseCase,
  ) {}

  @Get('me/progressions')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.SavedProgressions }] })
  @RequireAuth()
  async list() {
    const items = await this.listProgressions.execute(this.currentUser.require().id);
    return { items: items.map(toView) };
  }

  @Put('me/progressions/:name')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.SavedProgressions }] })
  @RequireAuth()
  save(@Param('name') name: string, @Body() body: SaveProgressionDto) {
    return this.saveProgression.execute(
      this.currentUser.require().id,
      name,
      body.keyRoot,
      body.chords,
    );
  }

  @Delete('me/progressions/:name')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.SavedProgressions }] })
  @RequireAuth()
  remove(@Param('name') name: string) {
    return this.deleteProgression.execute(this.currentUser.require().id, name);
  }
}

function toView(p: SavedProgression) {
  return {
    name: p.name,
    keyRoot: p.keyRoot,
    chords: p.chords,
    updatedAt: p.updatedAt.toISOString(),
  };
}
