import { SaveProgressionBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

/** Request body for saving a progression — validated at the edge by the global ZodValidationPipe. */
export class SaveProgressionDto extends createZodDto(SaveProgressionBody) {}
