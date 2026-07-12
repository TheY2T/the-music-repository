import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { type MailMessage, MailSender } from '../mail.port';

/**
 * Real SMTP mail sender (nodemailer). Selected only when `SMTP_URL` is configured (see
 * `mail.module.ts`); dormant but compiled + ready until then. Accepts an `SMTP_URL` connection string
 * (e.g. `smtps://user:pass@smtp.example.com:465`).
 */
@Injectable()
export class SmtpMailSender extends MailSender {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.transporter = createTransport(this.config.getOrThrow<string>('SMTP_URL'));
    this.from = this.config.get<string>('MAIL_FROM') ?? 'The Music Repository <no-reply@localhost>';
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
