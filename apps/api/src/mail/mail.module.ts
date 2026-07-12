import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogMailSender } from './infrastructure/log-mail.sender';
import { SmtpMailSender } from './infrastructure/smtp-mail.sender';
import { MailSender } from './mail.port';

/**
 * Mail transport. Binds `MailSender` to the **SMTP** adapter when `SMTP_URL` is configured, else the
 * **log** adapter (dev/CI — no delivery). App code depends only on the `MailSender` port. Exported so
 * feature modules (e.g. classrooms) can inject it.
 */
@Module({
  providers: [
    {
      provide: MailSender,
      useFactory: (config: ConfigService) =>
        config.get<string>('SMTP_URL') ? new SmtpMailSender(config) : new LogMailSender(),
      inject: [ConfigService],
    },
  ],
  exports: [MailSender],
})
export class MailModule {}
