import type { BillingEvent } from '../../domain/billing-event';

export interface CreateCheckoutRequest {
  userId: string;
  /** Where the provider sends the browser after success / cancel. */
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  /** URL to redirect the browser to (provider-hosted checkout, or the mock page in dev). */
  url: string;
  /** The provider session id (mock uuid or Stripe `cs_...`) — correlates the later webhook. */
  sessionId: string;
}

/**
 * CheckoutGateway (ADR 0012 — the capability of starting a provider checkout + verifying its
 * webhooks). Bound to `MockCheckoutGateway` (default, dev/CI) or `StripeCheckoutGateway` (when
 * `STRIPE_SECRET_KEY` is configured). The core depends only on this port, never on Stripe.
 */
export abstract class CheckoutGateway {
  /** `mock` | `stripe` — recorded on the checkout session. */
  abstract readonly provider: string;
  /** Create a checkout session and return where to send the browser. */
  abstract createCheckoutSession(req: CreateCheckoutRequest): Promise<CreateCheckoutResult>;
  /**
   * Verify + normalize an inbound webhook. Returns a `BillingEvent` to apply, or `null` for events
   * we don't handle. Throws `WebhookVerificationError` when the signature is invalid.
   */
  abstract parseWebhookEvent(
    rawBody: string,
    signature: string | undefined,
  ): Promise<BillingEvent | null>;
  /** Create a billing-portal session (manage card / cancel / invoices) — returns where to send the
   * browser. Mock returns the in-app subscription page. */
  abstract createBillingPortalSession(userId: string): Promise<{ url: string }>;
}
