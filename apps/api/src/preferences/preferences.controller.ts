import { FlagKeys } from '@TheY2T/tmr-flags';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { CurrentUser } from '../auth/application/current-user';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { GetPreferencesUseCase } from './application/use-cases/get-preferences.use-case';
import { UpdatePreferencesUseCase } from './application/use-cases/update-preferences.use-case';
import type { StoredInstrumentPreferences } from './domain/instrument-preferences';
import { UpdatePreferencesDto } from './dto/preferences.dto';

/**
 * Personalization — the acting user's immersive-instrument preferences (guitar handedness, chosen
 * piano/guitar skin, default-fullscreen). Every route requires authentication (the user id comes from
 * the `CurrentUser` port) and is gated on the `learning.instrument-customization` flag via **method-level**
 * `@RequireFlagsEnabled` (class-level drops route mapping — see api CLAUDE.md). The client keeps a
 * localStorage copy for anonymous use.
 */
@Controller()
export class PreferencesController {
  constructor(
    private readonly currentUser: CurrentUser,
    private readonly getPreferences: GetPreferencesUseCase,
    private readonly updatePreferences: UpdatePreferencesUseCase,
  ) {}

  @Get('me/preferences')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.InstrumentCustomization }] })
  @RequireAuth()
  async get() {
    return toView(await this.getPreferences.execute(this.currentUser.require().id));
  }

  @Put('me/preferences')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.InstrumentCustomization }] })
  @RequireAuth()
  async update(@Body() body: UpdatePreferencesDto) {
    const stored = await this.updatePreferences.execute(this.currentUser.require().id, {
      handedness: body.handedness,
      keyboardSkin: body.keyboardSkin,
      fretboardSkin: body.fretboardSkin,
      fullscreen: body.fullscreen,
    });
    return toView(stored);
  }
}

function toView(p: StoredInstrumentPreferences) {
  return {
    handedness: p.handedness,
    keyboardSkin: p.keyboardSkin,
    fretboardSkin: p.fretboardSkin,
    fullscreen: p.fullscreen,
    updatedAt: p.updatedAt.toISOString(),
  };
}
