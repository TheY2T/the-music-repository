import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CheckoutGateway,
  type CreateCheckoutRequest,
  type CreateCheckoutResult,
} from '../application/ports/checkout-gateway.port';
import { CheckoutSessionStore } from '../application/ports/checkout-session-store.port';
import type { BillingEvent } from '../domain/billing-event';
import { WebhookVerificationError } from '../domain/errors/webhook-verification.error';

const asId = (value: string | { id: string } | null | undefined): string | undefined =>
  typeof value === 'string' ? value : (value?.id ?? undefined);

/**
 * Real Stripe checkout gateway. Selected only when `STRIPE_SECRET_KEY` is configured (see
 * `billing.module.ts`); until keys are provisioned the `MockCheckoutGateway` is used, so this class
 * is dormant but compiled + ready. Verifies webhook signatures with `STRIPE_WEBHOOK_SECRET` — the
 * route must receive the **raw** request body for verification to work (see billing.controller.ts).
 */
@Injectable()
export class StripeCheckoutGateway extends CheckoutGateway {
  readonly provider = 'stripe';
  private readonly stripe: Stripe;
  private readonly priceId: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly sessions: CheckoutSessionStore,
  ) {
    super();
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'));
    this.priceId = this.config.getOrThrow<string>('STRIPE_PRICE_ID');
    this.webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
  }

  async createCheckoutSession(req: CreateCheckoutRequest): Promise<CreateCheckoutResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: this.priceId, quantity: 1 }],
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      client_reference_id: req.userId,
    });
    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }
    return { url: session.url, sessionId: session.id };
  }

  async parseWebhookEvent(
    rawBody: string,
    signature: string | undefined,
  ): Promise<BillingEvent | null> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature ?? '', this.webhookSecret);
    } catch {
      throw new WebhookVerificationError();
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) {
        return null;
      }
      const subscriptionId = asId(session.subscription);
      await this.sessions.markCompleted(session.id, {
        customerId: asId(session.customer),
        subscriptionId,
      });
      return {
        kind: 'activate',
        eventId: event.id,
        userId,
        expiresAt: null, // renewal/expiry handled by subscription lifecycle events (follow-up)
        stripeCustomerId: asId(session.customer),
        stripeSubscriptionId: subscriptionId,
      };
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const session = await this.sessions.findBySubscriptionId(subscription.id);
      if (!session) {
        return null;
      }
      return { kind: 'cancel', eventId: event.id, userId: session.userId };
    }

    return null;
  }
}
