import { Module } from '@nestjs/common';
import { DonationLedger } from './application/ports/donation-ledger.port';
import { RecordKofiDonationUseCase } from './application/record-kofi-donation.use-case';
import { DrizzleDonationLedger } from './infrastructure/drizzle-donation-ledger.repository';
import { KofiWebhookController } from './kofi-webhook.controller';

/**
 * Support feature (hexagonal). Records supporter contributions delivered by the Ko-fi webhook through
 * the `DonationLedger` port. Audit/analytics only — no entitlement side effects, so no dependency on
 * the entitlements/billing modules.
 */
@Module({
  controllers: [KofiWebhookController],
  providers: [
    RecordKofiDonationUseCase,
    { provide: DonationLedger, useClass: DrizzleDonationLedger },
  ],
})
export class SupportModule {}
