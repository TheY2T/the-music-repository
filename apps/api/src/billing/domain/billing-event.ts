/**
 * A payment-provider webhook, normalized to what the core cares about. Provider-agnostic: the mock
 * and Stripe gateways both parse their raw payloads into this shape, and the use-case applies it.
 */
export type BillingEvent =
  | {
      kind: 'activate';
      /** Provider event id — the idempotency key. */
      eventId: string;
      userId: string;
      /** null = no expiry; subscriptions set the end of the billing period. */
      expiresAt: Date | null;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    }
  | {
      kind: 'cancel';
      eventId: string;
      userId: string;
    };
