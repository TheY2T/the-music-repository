export interface CheckoutSessionRecord {
  id: string;
  userId: string;
  provider: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/** CheckoutSessionStore (ADR 0012) — persist provider checkout sessions so a later webhook can map
 * a provider session/subscription back to the user. */
export abstract class CheckoutSessionStore {
  abstract create(rec: { id: string; userId: string; provider: string }): Promise<void>;
  abstract findById(id: string): Promise<CheckoutSessionRecord | null>;
  abstract findBySubscriptionId(subscriptionId: string): Promise<CheckoutSessionRecord | null>;
  abstract markCompleted(
    id: string,
    stripe: { customerId?: string; subscriptionId?: string },
  ): Promise<void>;
  abstract markCanceled(id: string): Promise<void>;
}
