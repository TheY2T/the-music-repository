/** A premium grant as the core sees it — framework/db-free. */
export interface EntitlementGrant {
  /** How it was granted: `subscription` (mock checkout) | `staff` | `manual`. */
  source: string;
  grantedAt: Date;
  /** null = no expiry. */
  expiresAt: Date | null;
}

/** One entry in the entitlement audit log (grant/revoke history). */
export interface EntitlementEvent {
  key: string;
  action: 'grant' | 'revoke';
  source: string;
  at: Date;
}

/**
 * Entitlements (DDD) — the monetization requirement: persist and read a user's premium access grants.
 * A grant is a local stand-in for a payment-provider subscription. Named for the capability (ADR 0012).
 */
export abstract class Entitlements {
  /** The user's active premium grant, or null when absent/expired. */
  abstract getPremium(userId: string): Promise<EntitlementGrant | null>;
  /** Grant (or refresh) premium. Idempotent. `expiresAt` null = no expiry (e.g. staff/manual). */
  abstract grantPremium(userId: string, source: string, expiresAt?: Date | null): Promise<void>;
  /** Remove the user's premium grant. Idempotent. */
  abstract revokePremium(userId: string): Promise<void>;
  /** The user's grant/revoke history, most-recent first (audit log). */
  abstract history(userId: string): Promise<EntitlementEvent[]>;
}
