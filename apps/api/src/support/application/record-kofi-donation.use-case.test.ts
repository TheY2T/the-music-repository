import { describe, expect, it } from 'vitest';
import { KofiWebhookVerificationError } from '../domain/errors/kofi-webhook-verification.error';
import type { KofiDonation } from '../domain/kofi-donation';
import type { DonationLedger } from './ports/donation-ledger.port';
import { RecordKofiDonationUseCase } from './record-kofi-donation.use-case';

const TOKEN = 'kofi-secret-token';

/** A representative Ko-fi donation payload (the JSON string carried in the form `data` field). */
function payload(over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    verification_token: TOKEN,
    message_id: 'msg-1',
    timestamp: '2026-07-19T13:04:30Z',
    type: 'Donation',
    is_public: true,
    from_name: 'Jo Example',
    message: 'Keep it up!',
    amount: '3.00',
    email: 'jo@example.com',
    currency: 'AUD',
    is_subscription_payment: false,
    kofi_transaction_id: 'txn-1',
    ...over,
  });
}

/** In-memory DonationLedger — records donations and answers idempotency by messageId. */
function fakeLedger(): DonationLedger & { recorded: KofiDonation[] } {
  const recorded: KofiDonation[] = [];
  return {
    recorded,
    wasRecorded: (messageId) => Promise.resolve(recorded.some((d) => d.messageId === messageId)),
    record: (donation) => {
      recorded.push(donation);
      return Promise.resolve();
    },
  };
}

describe('RecordKofiDonationUseCase', () => {
  it('records a contribution when the verification token matches', async () => {
    const ledger = fakeLedger();
    await new RecordKofiDonationUseCase(ledger).execute(payload(), TOKEN);

    expect(ledger.recorded).toHaveLength(1);
    expect(ledger.recorded[0]).toMatchObject({
      messageId: 'msg-1',
      type: 'Donation',
      fromName: 'Jo Example',
      amount: '3.00',
      currency: 'AUD',
      isPublic: true,
    });
  });

  it('rejects a wrong verification token and records nothing', async () => {
    const ledger = fakeLedger();
    await expect(
      new RecordKofiDonationUseCase(ledger).execute(payload({ verification_token: 'nope' }), TOKEN),
    ).rejects.toBeInstanceOf(KofiWebhookVerificationError);
    expect(ledger.recorded).toHaveLength(0);
  });

  it('rejects when no expected token is configured (misconfigured deployment)', async () => {
    const ledger = fakeLedger();
    await expect(
      new RecordKofiDonationUseCase(ledger).execute(payload(), undefined),
    ).rejects.toBeInstanceOf(KofiWebhookVerificationError);
    expect(ledger.recorded).toHaveLength(0);
  });

  it('rejects an unparseable payload rather than throwing a raw error', async () => {
    const ledger = fakeLedger();
    await expect(
      new RecordKofiDonationUseCase(ledger).execute('not-json', TOKEN),
    ).rejects.toBeInstanceOf(KofiWebhookVerificationError);
    expect(ledger.recorded).toHaveLength(0);
  });

  it('is idempotent — a retried delivery with the same messageId records once', async () => {
    const ledger = fakeLedger();
    const useCase = new RecordKofiDonationUseCase(ledger);
    await useCase.execute(payload(), TOKEN);
    await useCase.execute(payload(), TOKEN);
    expect(ledger.recorded).toHaveLength(1);
  });

  it('normalizes a subscription payment with its tier name', async () => {
    const ledger = fakeLedger();
    await new RecordKofiDonationUseCase(ledger).execute(
      payload({
        type: 'Subscription',
        is_subscription_payment: true,
        tier_name: 'Bronze',
      }),
      TOKEN,
    );
    expect(ledger.recorded[0]).toMatchObject({
      type: 'Subscription',
      isSubscriptionPayment: true,
      tierName: 'Bronze',
    });
  });
});
