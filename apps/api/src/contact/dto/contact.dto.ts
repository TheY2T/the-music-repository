import { SubmitContactBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class SubmitContactDto extends createZodDto(SubmitContactBody) {}
