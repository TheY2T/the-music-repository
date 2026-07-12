import { Injectable, Logger } from '@nestjs/common';
import { type MailMessage, MailSender } from '../mail.port';

/**
 * Dev/CI mail sender — logs the message instead of delivering it (no SMTP required). Selected when no
 * SMTP transport is configured. The log line lets a developer see the invite link, etc.
 */
@Injectable()
export class LogMailSender extends MailSender {
  private readonly logger = new Logger('Mail');

  async send(message: MailMessage): Promise<void> {
    this.logger.log(`[dev-mail] to=${message.to} · subject="${message.subject}"\n${message.text}`);
  }
}
