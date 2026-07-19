import { Injectable } from '@nestjs/common';
import { createMailTransport, type MailTransport } from '../create-mail-transport';
import { type MailMessage, MailSender } from '../mail.port';

/**
 * Dev/CI mail sender — logs the message instead of delivering it (no SMTP required). Selected when no
 * SMTP transport is configured. The log line lets a developer see the reset link, invite link, etc.
 */
@Injectable()
export class LogMailSender extends MailSender {
  private readonly transport: MailTransport = createMailTransport({});

  async send(message: MailMessage): Promise<void> {
    await this.transport.send(message);
  }
}
