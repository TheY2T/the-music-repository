import { CreateHelpTopicBody, UpdateHelpTopicBody } from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateHelpTopicDto extends createZodDto(CreateHelpTopicBody) {}
export class UpdateHelpTopicDto extends createZodDto(UpdateHelpTopicBody) {}
