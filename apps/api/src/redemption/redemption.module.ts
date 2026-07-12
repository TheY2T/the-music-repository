import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { RedeemCodeStore } from './application/ports/redeem-code-store.port';
import { CreateRedeemCodeUseCase, RedeemCodeUseCase } from './application/redemption.use-cases';
import { DrizzleRedeemCodeStore } from './infrastructure/drizzle-redeem-code-store';
import { RedemptionController } from './redemption.controller';

/**
 * Gift / redeem codes feature (hexagonal). Imports AuthModule (`CurrentUser`) + EntitlementsModule
 * (grants go through the existing `Entitlements` port). Binds `RedeemCodeStore` to its Drizzle adapter.
 */
@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [RedemptionController],
  providers: [
    CreateRedeemCodeUseCase,
    RedeemCodeUseCase,
    { provide: RedeemCodeStore, useClass: DrizzleRedeemCodeStore },
  ],
})
export class RedemptionModule {}
