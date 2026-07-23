import { Injectable } from '@nestjs/common';
import { createWhatsAppTransport, type WhatsAppTransport } from '../create-whatsapp-sender';
import { type WhatsAppOtpMessage, WhatsAppSender } from '../whatsapp.port';

/**
 * Dev/CI WhatsApp sender — logs the one-time code instead of delivering it (no Cloud API credentials
 * required). Selected when no WhatsApp Business sender is configured. The log line lets a developer read
 * the code during local sign-in.
 */
@Injectable()
export class LogWhatsAppSender extends WhatsAppSender {
  private readonly transport: WhatsAppTransport = createWhatsAppTransport({});

  async send(message: WhatsAppOtpMessage): Promise<void> {
    await this.transport.send(message);
  }
}
