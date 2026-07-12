import { FlagKeys } from '@TheY2T/tmr-flags';
import { Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';
import { RequireAuth } from '../auth/require-permissions.decorator';
import { PremiumAccessService } from './application/premium-access.service';

/**
 * Subscription surface — the acting user's premium entitlement. Gated by `monetization.premium`
 * (disabled → 404) and requires authentication. `activate` is a **mock checkout** standing in for a
 * payment-provider webhook; no real billing is wired yet.
 */
@Controller()
export class SubscriptionController {
  constructor(private readonly premiumAccess: PremiumAccessService) {}

  @Get('me/subscription')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  status() {
    return this.premiumAccess.status();
  }

  @Post('me/subscription/activate')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  activate() {
    return this.premiumAccess.activate();
  }

  @Delete('me/subscription')
  @HttpCode(204)
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  cancel() {
    return this.premiumAccess.cancel();
  }

  @Get('me/entitlements/history')
  @RequireFlagsEnabled({ flags: [{ flagKey: FlagKeys.Premium }] })
  @RequireAuth()
  async history() {
    const events = await this.premiumAccess.history();
    return {
      items: events.map((e) => ({
        key: e.key,
        action: e.action,
        source: e.source,
        at: e.at.toISOString(),
      })),
    };
  }
}
