import { UpdateAchievementsBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

/** Request body for saving achievements — validated at the edge by the global ZodValidationPipe. */
export class UpdateAchievementsDto extends createZodDto(UpdateAchievementsBody) {}
