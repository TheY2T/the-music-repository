import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SubmitContactUseCase } from './application/submit-contact.use-case';
import { SubmitContactDto } from './dto/contact.dto';

/** Public contact form: emails a submission to the site operators. */
@Controller('contact')
export class ContactController {
  constructor(private readonly submitContact: SubmitContactUseCase) {}

  @Post()
  @HttpCode(201)
  async submit(@Body() body: SubmitContactDto): Promise<{ ok: boolean }> {
    return this.submitContact.execute(body);
  }
}
