import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createMailTransport, type MailTransport } from '../create-mail-transport';
import { type MailMessage, MailSender } from '../mail.port';

/**
 * Real SMTP mail sender (nodemailer). Selected only when `SMTP_URL` is configured (see
 * `mail.module.ts`). Accepts an `SMTP_URL` connection string (e.g. `smtps://user:pass@smtp.example.com:465`).
 */
@Injectable()
export class SmtpMailSender extends MailSender {
  private readonly transport: MailTransport;

  constructor(config: ConfigService) {
    super();
    this.transport = createMailTransport({
      smtpUrl: config.getOrThrow<string>('SMTP_URL'),
      from: config.get<string>('MAIL_FROM'),
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.send(message);
  }
}
