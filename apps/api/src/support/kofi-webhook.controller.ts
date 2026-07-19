import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecordKofiDonationUseCase } from './application/record-kofi-donation.use-case';

/** Ko-fi delivers the event as an `application/x-www-form-urlencoded` body with a single `data` field
 * holding a JSON string. */
interface KofiWebhookBody {
  data?: string;
}

/**
 * Ko-fi support webhook. `POST /support/kofi/webhook` is an **inbound provider endpoint** — like
 * `POST /billing/webhook` it is kept out of the client contract, unauthenticated, and NOT flag-gated
 * (Ko-fi posts regardless of the site's `support.kofi` UI flag). Authenticity is established by the
 * shared verification token inside the payload. Always answers 200 on a handled event so Ko-fi stops
 * retrying.
 */
@Controller()
export class KofiWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly recordDonation: RecordKofiDonationUseCase,
  ) {}

  @Post('support/kofi/webhook')
  @HttpCode(200)
  async webhook(@Body() body: KofiWebhookBody): Promise<{ received: true }> {
    await this.recordDonation.execute(
      body.data ?? '',
      this.config.get<string>('KOFI_VERIFICATION_TOKEN'),
    );
    return { received: true };
  }
}
