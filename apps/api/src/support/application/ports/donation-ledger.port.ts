import type { KofiDonation } from '../../domain/kofi-donation';

/**
 * DonationLedger (ADR 0012) — records supporter contributions received from Ko-fi and answers whether
 * a given `messageId` was already recorded, so retried webhook deliveries are stored exactly once.
 */
export abstract class DonationLedger {
  abstract wasRecorded(messageId: string): Promise<boolean>;
  abstract record(donation: KofiDonation): Promise<void>;
}
