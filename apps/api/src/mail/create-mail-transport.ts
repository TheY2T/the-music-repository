import { Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import type { MailMessage } from './mail.port';

const DEFAULT_FROM = 'The Music Repository <no-reply@localhost>';

/** A transport that can deliver a `MailMessage`. */
export interface MailTransport {
  send(message: MailMessage): Promise<void>;
}

export interface MailTransportConfig {
  /** SMTP connection string (e.g. `smtps://user:pass@host:465`). When unset, mail is logged, not sent. */
  smtpUrl?: string;
  /** `From` header for outbound mail. */
  from?: string;
}

/**
 * Selects a mail transport from configuration: an SMTP transport (nodemailer) when `smtpUrl` is set,
 * otherwise a transport that logs the message for local development. Shared by the Nest `MailModule`
 * and the module-scoped Better Auth instance, which reads `process.env` directly rather than Nest DI.
 */
export function createMailTransport({
  smtpUrl,
  from = DEFAULT_FROM,
}: MailTransportConfig): MailTransport {
  if (smtpUrl) {
    const transporter = createTransport(smtpUrl);
    return {
      async send(message) {
        await transporter.sendMail({
          from,
          to: message.to,
          replyTo: message.replyTo,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
      },
    };
  }

  const logger = new Logger('Mail');
  return {
    async send(message) {
      logger.log(`[dev-mail] to=${message.to} · subject="${message.subject}"\n${message.text}`);
    },
  };
}
