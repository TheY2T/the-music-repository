import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { SubmitContactUseCase } from './application/submit-contact.use-case';
import { ContactController } from './contact.controller';

/** Contact feature — a public form that emails the operators via the `MailSender` port. */
@Module({
  imports: [MailModule],
  controllers: [ContactController],
  providers: [SubmitContactUseCase],
})
export class ContactModule {}
