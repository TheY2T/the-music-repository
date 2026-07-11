import {
  CreateCollectionBody,
  SetCollectionItemsBody,
  UpdateCollectionBody,
} from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateCollectionDto extends createZodDto(CreateCollectionBody) {}
export class UpdateCollectionDto extends createZodDto(UpdateCollectionBody) {}
export class SetCollectionItemsDto extends createZodDto(SetCollectionItemsBody) {}
