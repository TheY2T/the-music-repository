import { PublishTranslationsBody, UpsertTranslationBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class UpsertTranslationDto extends createZodDto(UpsertTranslationBody) {}
export class PublishTranslationsDto extends createZodDto(PublishTranslationsBody) {}
