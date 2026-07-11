import { GradeCardBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class GradeCardDto extends createZodDto(GradeCardBody) {}
