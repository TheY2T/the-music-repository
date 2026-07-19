import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../infrastructure/database/database.module';
import { kofiDonations } from '../../infrastructure/database/schema';
import { DonationLedger } from '../application/ports/donation-ledger.port';
import type { KofiDonation } from '../domain/kofi-donation';

@Injectable()
export class DrizzleDonationLedger extends DonationLedger {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async wasRecorded(messageId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ messageId: kofiDonations.messageId })
      .from(kofiDonations)
      .where(eq(kofiDonations.messageId, messageId))
      .limit(1);
    return !!row;
  }

  async record(donation: KofiDonation): Promise<void> {
    await this.db
      .insert(kofiDonations)
      .values({
        messageId: donation.messageId,
        kofiTransactionId: donation.kofiTransactionId ?? null,
        type: donation.type,
        fromName: donation.fromName ?? null,
        email: donation.email ?? null,
        amount: donation.amount ?? null,
        currency: donation.currency ?? null,
        message: donation.message ?? null,
        isPublic: donation.isPublic,
        isSubscriptionPayment: donation.isSubscriptionPayment,
        tierName: donation.tierName ?? null,
        kofiTimestamp: new Date(donation.timestamp),
        raw: donation.raw,
      })
      .onConflictDoNothing();
  }
}
