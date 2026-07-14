import {
  CreateCollectionBody,
  CreateUserCollectionBody,
  RateCollectionBody,
  SetCollectionItemsBody,
  SetCollectionSectionsBody,
  SetUserCollectionItemsBody,
  UpdateCollectionBody,
  UpdateUserCollectionBody,
} from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateCollectionDto extends createZodDto(CreateCollectionBody) {}
export class UpdateCollectionDto extends createZodDto(UpdateCollectionBody) {}
export class SetCollectionItemsDto extends createZodDto(SetCollectionItemsBody) {}
export class SetCollectionSectionsDto extends createZodDto(SetCollectionSectionsBody) {}
export class RateCollectionDto extends createZodDto(RateCollectionBody) {}
export class CreateUserCollectionDto extends createZodDto(CreateUserCollectionBody) {}
export class UpdateUserCollectionDto extends createZodDto(UpdateUserCollectionBody) {}
export class SetUserCollectionItemsDto extends createZodDto(SetUserCollectionItemsBody) {}
