import { UnauthorizedError } from '@TheY2T/tmr-errors';

/** The inbound Ko-fi webhook carried a missing or wrong verification token (→ problem+json, 401). */
export class KofiWebhookVerificationError extends UnauthorizedError {
  readonly code = 'KOFI_WEBHOOK_VERIFICATION_FAILED';

  constructor() {
    super('The Ko-fi webhook verification token could not be verified.');
  }
}
