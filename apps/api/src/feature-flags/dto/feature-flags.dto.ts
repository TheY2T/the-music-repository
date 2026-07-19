import {
  CreateEnvironmentBody,
  CreateFeatureFlagBody,
  ImportFeatureFlagsBody,
  UpdateEnvironmentBody,
  UpdateFeatureFlagBody,
  UpsertFlagSettingBody,
} from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateFeatureFlagDto extends createZodDto(CreateFeatureFlagBody) {}
export class UpdateFeatureFlagDto extends createZodDto(UpdateFeatureFlagBody) {}
export class UpsertFlagSettingDto extends createZodDto(UpsertFlagSettingBody) {}
export class CreateEnvironmentDto extends createZodDto(CreateEnvironmentBody) {}
export class UpdateEnvironmentDto extends createZodDto(UpdateEnvironmentBody) {}
export class ImportFeatureFlagsDto extends createZodDto(ImportFeatureFlagsBody) {}
