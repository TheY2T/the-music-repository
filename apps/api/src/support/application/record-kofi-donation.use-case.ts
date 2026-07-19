import { Injectable, Logger } from '@nestjs/common';
import { KofiWebhookVerificationError } from '../domain/errors/kofi-webhook-verification.error';
import { parseKofiPayload, toKofiDonation } from './kofi-payload';
import { DonationLedger } from './ports/donation-ledger.port';

/**
 * Apply an inbound Ko-fi webhook: parse the payload, verify its shared token, then record the
 * contribution. Idempotent — a retried delivery (same `messageId`) is a no-op. A missing/wrong token
 * raises `KofiWebhookVerificationError` (→ 401 problem+json). Recording is audit/analytics only; it
 * grants no entitlements.
 */
@Injectable()
export class RecordKofiDonationUseCase {
  private readonly logger = new Logger(RecordKofiDonationUseCase.name);

  constructor(private readonly ledger: DonationLedger) {}

  async execute(data: string, expectedToken: string | undefined): Promise<void> {
    // Only ever act on a payload we can both parse and verify; anything unparseable is rejected as
    // unauthenticated rather than surfacing as a 500. An unset expected token can never verify, so a
    // misconfigured deployment safely rejects everything.
    let payload: ReturnType<typeof parseKofiPayload>;
    try {
      payload = parseKofiPayload(data);
    } catch {
      throw new KofiWebhookVerificationError();
    }
    if (!expectedToken || payload.verification_token !== expectedToken) {
      throw new KofiWebhookVerificationError();
    }

    if (await this.ledger.wasRecorded(payload.message_id)) {
      return; // already recorded (Ko-fi retry) — idempotent
    }

    await this.ledger.record(toKofiDonation(payload));
    this.logger.log(`Recorded Ko-fi ${payload.type} ${payload.message_id}`);
  }
}
