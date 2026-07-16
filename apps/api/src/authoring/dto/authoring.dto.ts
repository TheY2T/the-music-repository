import {
  CreateContentBody,
  CreateTaxonomyBody,
  RequestMediaUploadBody,
  SetContentScoreBody,
  UpdateContentBody,
} from '@TheY2T/tmr-contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * Request DTOs wrap the generated Zod schemas (source of truth: TypeSpec → openapi.json). The global
 * ZodValidationPipe validates them at the transport edge → invalid bodies become 422 problem+json.
 */
export class CreateContentDto extends createZodDto(CreateContentBody) {}
export class UpdateContentDto extends createZodDto(UpdateContentBody) {}
export class RequestMediaUploadDto extends createZodDto(RequestMediaUploadBody) {}
export class SetContentScoreDto extends createZodDto(SetContentScoreBody) {}
export class CreateTaxonomyDto extends createZodDto(CreateTaxonomyBody) {}
