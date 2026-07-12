export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * MailSender (ADR 0012) — the capability of delivering an email. Bound to `SmtpMailSender` when SMTP
 * is configured (`SMTP_URL`/`SMTP_HOST`), else `LogMailSender` (dev/CI — logs the message, sends
 * nothing). App code depends only on this port, never on a mail library.
 */
export abstract class MailSender {
  abstract send(message: MailMessage): Promise<void>;
}
