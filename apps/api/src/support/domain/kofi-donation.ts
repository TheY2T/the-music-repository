/** The Ko-fi event types a webhook can carry. */
export const KOFI_TYPES = ['Donation', 'Subscription', 'Commission', 'Shop Order'] as const;

/**
 * A single supporter contribution received from Ko-fi, normalized for storage. One record per Ko-fi
 * `messageId` (the idempotency key — Ko-fi retries a delivery with the same id until it gets a 200).
 * `raw` retains the full verified payload for later analysis.
 */
export interface KofiDonation {
  /** Ko-fi's unique id for this webhook message — the idempotency key. */
  messageId: string;
  /** Ko-fi's transaction id, when present. */
  kofiTransactionId?: string | null;
  /** `Donation` | `Subscription` | `Commission` | `Shop Order`. */
  type: string;
  /** Supporter's display name, when they made it public. */
  fromName?: string | null;
  email?: string | null;
  /** Decimal amount as sent by Ko-fi, e.g. `"3.00"`. */
  amount?: string | null;
  currency?: string | null;
  message?: string | null;
  isPublic: boolean;
  isSubscriptionPayment: boolean;
  /** Membership tier name for subscription payments. */
  tierName?: string | null;
  /** ISO-8601 timestamp Ko-fi stamped on the event. */
  timestamp: string;
  /** The full verified payload, kept verbatim. */
  raw: unknown;
}
