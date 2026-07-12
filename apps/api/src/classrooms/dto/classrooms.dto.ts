import { CreateClassroomBody, JoinClassroomBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateClassroomDto extends createZodDto(CreateClassroomBody) {}
export class JoinClassroomDto extends createZodDto(JoinClassroomBody) {}
