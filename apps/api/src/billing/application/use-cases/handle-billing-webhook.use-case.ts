import { Injectable, Logger } from '@nestjs/common';
import { Entitlements } from '../../../entitlements/application/ports/entitlements.port';
import { CheckoutGateway } from '../ports/checkout-gateway.port';
import { WebhookLedger } from '../ports/webhook-ledger.port';

/**
 * Apply an inbound billing webhook: verify + normalize it (gateway), then grant/revoke premium via
 * the existing `Entitlements` port. Idempotent — a retried delivery (same event id) is a no-op.
 * Signature-verification failures propagate as `WebhookVerificationError` (→ 4xx problem+json).
 */
@Injectable()
export class HandleBillingWebhookUseCase {
  private readonly logger = new Logger(HandleBillingWebhookUseCase.name);

  constructor(
    private readonly gateway: CheckoutGateway,
    private readonly ledger: WebhookLedger,
    private readonly entitlements: Entitlements,
  ) {}

  async execute(rawBody: string, signature: string | undefined): Promise<void> {
    const event = await this.gateway.parseWebhookEvent(rawBody, signature);
    if (!event) {
      return; // unhandled event type — acknowledge without action
    }
    if (await this.ledger.wasProcessed(event.eventId)) {
      return; // already handled (provider retry) — idempotent
    }
    if (event.kind === 'activate') {
      await this.entitlements.grant(event.userId, event.key, 'subscription', event.expiresAt);
      this.logger.log(`Granted '${event.key}' to ${event.userId} via webhook ${event.eventId}`);
    } else {
      await this.entitlements.revokePremium(event.userId);
      this.logger.log(`Premium revoked for ${event.userId} via webhook ${event.eventId}`);
    }
    await this.ledger.markProcessed(event.eventId);
  }
}
