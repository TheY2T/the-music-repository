import { ValidationError } from '@TheY2T/tmr-errors';

/** The anti-bot challenge (Cloudflare Turnstile) did not verify → 400 problem+json. */
export class CaptchaFailedError extends ValidationError {
  readonly code = 'CAPTCHA_FAILED';

  constructor() {
    super('Anti-bot verification failed. Please try again.');
  }
}
