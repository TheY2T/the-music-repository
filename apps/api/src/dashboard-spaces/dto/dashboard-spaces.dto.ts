import { UpdateDashboardSpacesBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

/** Request body for saving dashboard spaces — validated at the edge by the global ZodValidationPipe. */
export class UpdateDashboardSpacesDto extends createZodDto(UpdateDashboardSpacesBody) {}
