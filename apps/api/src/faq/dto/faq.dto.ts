import { CreateFaqEntryBody, UpdateFaqEntryBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateFaqEntryDto extends createZodDto(CreateFaqEntryBody) {}
export class UpdateFaqEntryDto extends createZodDto(UpdateFaqEntryBody) {}
