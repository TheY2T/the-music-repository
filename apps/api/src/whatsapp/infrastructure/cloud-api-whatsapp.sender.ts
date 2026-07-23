import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWhatsAppTransport, type WhatsAppTransport } from '../create-whatsapp-sender';
import { type WhatsAppOtpMessage, WhatsAppSender } from '../whatsapp.port';

/**
 * Real WhatsApp Cloud API sender. Selected only when a WhatsApp Business sender is configured (see
 * `whatsapp.module.ts`). Posts an approved AUTHENTICATION-category template carrying the one-time code.
 */
@Injectable()
export class CloudApiWhatsAppSender extends WhatsAppSender {
  private readonly transport: WhatsAppTransport;

  constructor(config: ConfigService) {
    super();
    this.transport = createWhatsAppTransport({
      accessToken: config.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN'),
      phoneNumberId: config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID'),
      templateName: config.getOrThrow<string>('WHATSAPP_OTP_TEMPLATE_NAME'),
      templateLang: config.get<string>('WHATSAPP_TEMPLATE_LANG'),
      graphVersion: config.get<string>('WHATSAPP_GRAPH_VERSION'),
    });
  }

  async send(message: WhatsAppOtpMessage): Promise<void> {
    await this.transport.send(message);
  }
}
