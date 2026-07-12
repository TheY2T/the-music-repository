/** WebhookLedger (ADR 0012) — records processed webhook event ids so retried deliveries are
 * handled exactly once (idempotency). */
export abstract class WebhookLedger {
  abstract wasProcessed(eventId: string): Promise<boolean>;
  abstract markProcessed(eventId: string): Promise<void>;
}
