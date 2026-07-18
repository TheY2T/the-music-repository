import { RecordDrillAttemptBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class RecordDrillAttemptDto extends createZodDto(RecordDrillAttemptBody) {}
