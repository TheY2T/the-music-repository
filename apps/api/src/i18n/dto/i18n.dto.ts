import {
  CreateUiMessageBody,
  PublishUiMessagesBody,
  UpdateUiMessageBody,
} from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateUiMessageDto extends createZodDto(CreateUiMessageBody) {}
export class UpdateUiMessageDto extends createZodDto(UpdateUiMessageBody) {}
export class PublishUiMessagesDto extends createZodDto(PublishUiMessagesBody) {}
