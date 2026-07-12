import { ValidationError } from '@TheY2T/tmr-errors';

/** The inbound webhook payload failed signature verification (→ problem+json, 4xx). */
export class WebhookVerificationError extends ValidationError {
  readonly code = 'WEBHOOK_VERIFICATION_FAILED';

  constructor() {
    super('The webhook signature could not be verified.');
  }
}
