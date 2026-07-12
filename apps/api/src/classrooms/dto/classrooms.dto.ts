import {
  AssignContentBody,
  CreateClassroomBody,
  JoinClassroomBody,
  TransferClassroomOwnershipBody,
} from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateClassroomDto extends createZodDto(CreateClassroomBody) {}
export class JoinClassroomDto extends createZodDto(JoinClassroomBody) {}
export class AssignContentDto extends createZodDto(AssignContentBody) {}
export class TransferOwnershipDto extends createZodDto(TransferClassroomOwnershipBody) {}
