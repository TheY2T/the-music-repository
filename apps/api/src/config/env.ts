import { z } from 'zod';

/** Environment schema — validated at boot so misconfiguration fails fast. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  FLAGD_HOST: z.string().default('localhost'),
  FLAGD_PORT: z.coerce.number().int().positive().default(8013),

  // Catalogue search (Meilisearch). Defaults match `pnpm infra:up` on localhost.
  MEILI_HOST: z.string().default('http://localhost:7700'),
  MEILI_MASTER_KEY: z.string().default('tmr_dev_master_key'),

  // Catalogue media (MinIO / S3). Defaults match the compose so the app boots for local dev.
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_PUBLIC_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().default('tmr'),
  S3_SECRET_ACCESS_KEY: z.string().default('tmrsecret'),
  S3_BUCKET: z.string().default('tmr-media'),

  // Auth (Slice 2, Better Auth). Dev defaults are local-only — never reuse in production.
  BETTER_AUTH_SECRET: z.string().min(1).default('dev-insecure-secret-change-me-please-32chars'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
  // Comma-separated. Origins allowed to send credentialed requests + accept auth cookies.
  TRUSTED_ORIGINS: z.string().default('http://localhost:4321,http://localhost:3000'),

  // Billing (Phase 6). When STRIPE_SECRET_KEY is set the Stripe checkout gateway is used; otherwise
  // the MockCheckoutGateway (dev/CI) — no keys, no charges. STRIPE_WEBHOOK_SECRET defaults to a
  // non-sensitive dev value the mock ignores. WEB_BASE_URL builds checkout success/cancel URLs.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_mock_dev_secret'),
  STRIPE_PRICE_ID: z.string().optional(),
  WEB_BASE_URL: z.string().default('http://localhost:4321'),
});

export type Env = z.infer<typeof envSchema>;

/** @nestjs/config `validate` hook. */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
