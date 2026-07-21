import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { CaptchaVerifier } from './application/ports/captcha-verifier.port';
import { SubmitContactUseCase } from './application/submit-contact.use-case';
import { ContactController } from './contact.controller';
import { TurnstileCaptchaVerifier } from './infrastructure/turnstile-captcha-verifier.adapter';

/** Contact feature — a public form that emails the operators via the `MailSender` port, gated by an
 * anti-bot challenge (`CaptchaVerifier`). */
@Module({
  imports: [MailModule],
  controllers: [ContactController],
  providers: [
    SubmitContactUseCase,
    { provide: CaptchaVerifier, useClass: TurnstileCaptchaVerifier },
  ],
})
export class ContactModule {}
