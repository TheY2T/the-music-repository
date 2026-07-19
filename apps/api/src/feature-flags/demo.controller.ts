import { FlagDefaults, FlagKeys } from '@TheY2T/tmr-flags';
import { Controller, Get } from '@nestjs/common';
import { OpenFeatureClient, RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import type { Client } from '@openfeature/server-sdk';

/**
 * Demo of the feature-flag rig. `GET /demo/flags` returns the current value (consumed by the web health
 * island); `GET /demo/banner` is gated by the flag and 404s when it is disabled — exercising both
 * imperative evaluation and route gating.
 */
@Controller('demo')
export class DemoController {
  constructor(@OpenFeatureClient() private readonly flags: Client) {}

  @Get('flags')
  async getFlags(): Promise<{ demoNewBanner: boolean }> {
    const demoNewBanner = await this.flags.getBooleanValue(
      FlagKeys.DemoNewBanner,
      FlagDefaults[FlagKeys.DemoNewBanner],
    );
    return { demoNewBanner };
  }

  @Get('banner')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.DemoNewBanner }] })
  getBanner(): { message: string } {
    return { message: 'The new banner is enabled for you 🎉' };
  }
}
