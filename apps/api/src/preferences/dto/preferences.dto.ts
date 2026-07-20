import { UpdatePreferencesBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

/** Request body for saving instrument preferences — validated at the edge by the global ZodValidationPipe. */
export class UpdatePreferencesDto extends createZodDto(UpdatePreferencesBody) {}
