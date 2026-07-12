import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { Entitlements } from './application/ports/entitlements.port';
import { PremiumAccessService } from './application/premium-access.service';
import { DrizzleEntitlements } from './infrastructure/drizzle-entitlements.repository';
import { SubscriptionController } from './subscription.controller';

/**
 * Entitlements / monetization feature (hexagonal). Imports AuthModule for the `CurrentUser` port.
 * Exports `PremiumAccessService` so the catalogue can resolve premium gating, and `Entitlements` for
 * the seed to grant staff/dev access.
 */
@Module({
  imports: [AuthModule],
  controllers: [SubscriptionController],
  providers: [PremiumAccessService, { provide: Entitlements, useClass: DrizzleEntitlements }],
  exports: [PremiumAccessService, Entitlements],
})
export class EntitlementsModule {}
