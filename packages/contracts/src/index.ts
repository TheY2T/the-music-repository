import type { z } from 'zod';
import { GetHealthResponse } from './generated/schemas';

// Zod DTOs generated from the OpenAPI spec (source of truth: TypeSpec → openapi.json).
export * from './generated/schemas';

/** Response contract for `GET /health`, derived from the generated schema. */
export type HealthStatus = z.infer<typeof GetHealthResponse>;
