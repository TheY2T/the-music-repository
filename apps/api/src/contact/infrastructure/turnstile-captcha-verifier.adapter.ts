import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CaptchaVerifier } from '../application/ports/captcha-verifier.port';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifies a Cloudflare Turnstile token against the siteverify endpoint. When `TURNSTILE_SECRET_KEY`
 * is unset the challenge is treated as disabled and every request passes — so local/dev and
 * environments without Turnstile configured are never blocked.
 */
@Injectable()
export class TurnstileCaptchaVerifier extends CaptchaVerifier {
  private readonly logger = new Logger(TurnstileCaptchaVerifier.name);
  private readonly secret: string | undefined;

  constructor(config: ConfigService) {
    super();
    this.secret = config.get<string>('TURNSTILE_SECRET_KEY');
  }

  async verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    if (!this.secret) {
      return true;
    }
    if (!token) {
      return false;
    }
    const body = new URLSearchParams({ secret: this.secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }
    try {
      const response = await fetch(SITEVERIFY_URL, { method: 'POST', body });
      const result = (await response.json()) as { success?: boolean };
      return result.success === true;
    } catch (error) {
      // A verifier outage must not silently let bots through, but shouldn't 500 either — reject.
      this.logger.warn(`Turnstile verification request failed: ${String(error)}`);
      return false;
    }
  }
}
