import { LogPracticeBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class LogPracticeDto extends createZodDto(LogPracticeBody) {}
