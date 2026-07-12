import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CheckoutGateway,
  type CreateCheckoutRequest,
  type CreateCheckoutResult,
} from '../application/ports/checkout-gateway.port';
import { CheckoutSessionStore } from '../application/ports/checkout-session-store.port';
import type { BillingEvent } from '../domain/billing-event';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Dev/CI checkout gateway — no Stripe, no charges. `createCheckoutSession` returns a local mock
 * checkout page URL; the browser "pays" by POSTing a mock event to `/billing/webhook`, which this
 * gateway resolves back to the user via the persisted session. Signature verification is a no-op
 * (there is no provider secret to check). Selected whenever `STRIPE_SECRET_KEY` is unset.
 */
@Injectable()
export class MockCheckoutGateway extends CheckoutGateway {
  readonly provider = 'mock';

  constructor(
    private readonly config: ConfigService,
    private readonly sessions: CheckoutSessionStore,
  ) {
    super();
  }

  async createCheckoutSession(req: CreateCheckoutRequest): Promise<CreateCheckoutResult> {
    const sessionId = `mock_${randomUUID()}`;
    const webBase = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:4321';
    const params = new URLSearchParams({
      session: sessionId,
      success: req.successUrl,
      cancel: req.cancelUrl,
    });
    return { url: `${webBase}/upgrade/checkout?${params.toString()}`, sessionId };
  }

  async createBillingPortalSession(): Promise<{ url: string }> {
    // No real provider portal in dev — send the user to the in-app subscription page (cancel lives there).
    const webBase = this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:4321';
    return { url: `${webBase}/upgrade` };
  }

  async parseWebhookEvent(rawBody: string): Promise<BillingEvent | null> {
    const payload = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: { object?: { id?: string } };
    };
    const eventId = payload.id ?? `mock_evt_${randomUUID()}`;
    const sessionId = payload.data?.object?.id;
    if (!sessionId) {
      return null;
    }
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      return null;
    }
    // `checkout.session.completed` (first purchase) + `invoice.paid` (renewal) both (re)grant with a
    // fresh 30-day period — the idempotency key (event id) makes each a distinct renewal.
    if (payload.type === 'checkout.session.completed' || payload.type === 'invoice.paid') {
      await this.sessions.markCompleted(sessionId, {});
      return {
        kind: 'activate',
        eventId,
        userId: session.userId,
        expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
      };
    }
    if (payload.type === 'customer.subscription.deleted') {
      await this.sessions.markCanceled(sessionId);
      return { kind: 'cancel', eventId, userId: session.userId };
    }
    return null;
  }
}
