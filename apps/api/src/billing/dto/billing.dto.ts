import { StartCheckoutBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

/** Request body for starting a checkout (the plan to purchase). */
export class StartCheckoutDto extends createZodDto(StartCheckoutBody) {}
