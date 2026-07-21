import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailSender } from '../../mail/mail.port';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot field — real users leave it empty. */
  company?: string;
}

/**
 * Delivers a contact-form message to the site operators. The sender's address becomes the reply-to, so
 * a reply reaches them directly. A filled honeypot is accepted but silently dropped (no email sent), so
 * bots get the same response as humans.
 */
@Injectable()
export class SubmitContactUseCase {
  constructor(
    private readonly mail: MailSender,
    private readonly config: ConfigService,
  ) {}

  async execute(input: ContactMessage): Promise<{ ok: true }> {
    if (input.company?.trim()) {
      return { ok: true };
    }
    const recipient = this.config.get<string>('CONTACT_RECIPIENT') ?? 'michael.hewett.87@gmail.com';
    await this.mail.send({
      to: recipient,
      replyTo: input.email,
      subject: `[Contact] ${input.subject}`,
      text: `New contact message from ${input.name} <${input.email}>\n\nSubject: ${input.subject}\n\n${input.message}\n`,
    });
    return { ok: true };
  }
}
