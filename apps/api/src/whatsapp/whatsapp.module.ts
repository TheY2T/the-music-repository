import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudApiWhatsAppSender } from './infrastructure/cloud-api-whatsapp.sender';
import { LogWhatsAppSender } from './infrastructure/log-whatsapp.sender';
import { WhatsAppSender } from './whatsapp.port';

/**
 * WhatsApp OTP delivery. Binds `WhatsAppSender` to the **Cloud API** adapter when a WhatsApp Business
 * sender is configured (`WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_OTP_TEMPLATE_NAME`),
 * else the **log** adapter (dev/CI — no delivery). App code depends only on the `WhatsAppSender` port.
 * Exported so feature modules can inject it.
 */
@Module({
  providers: [
    {
      provide: WhatsAppSender,
      useFactory: (config: ConfigService) =>
        config.get<string>('WHATSAPP_ACCESS_TOKEN') &&
        config.get<string>('WHATSAPP_PHONE_NUMBER_ID') &&
        config.get<string>('WHATSAPP_OTP_TEMPLATE_NAME')
          ? new CloudApiWhatsAppSender(config)
          : new LogWhatsAppSender(),
      inject: [ConfigService],
    },
  ],
  exports: [WhatsAppSender],
})
export class WhatsAppModule {}
