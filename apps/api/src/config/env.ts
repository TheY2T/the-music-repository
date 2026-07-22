import { z } from 'zod';

/** Environment schema — validated at boot so misconfiguration fails fast. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  // Names which feature-flag environment this deployment resolves against (matches a
  // `feature_flag_environments.key`; unmatched values fall back to the `is_default` env). Free-form
  // because environments are DB-managed/CRUD-able, not a fixed enum. Seeded envs: dev | uat | prod.
  APP_ENV: z.string().default('dev'),

  // Base URL the browser uses to reach stored media (the API's public origin). Falls back to
  // BETTER_AUTH_URL when unset, so local dev needs no extra config.
  MEDIA_PUBLIC_URL: z.string().optional(),

  // Auth (Slice 2, Better Auth). Dev defaults are local-only — never reuse in production.
  BETTER_AUTH_SECRET: z.string().min(1).default('dev-insecure-secret-change-me-please-32chars'),
  BETTER_AUTH_URL: z.string().default('http://localhost:3000'),
  // Comma-separated. Origins allowed to send credentialed requests + accept auth cookies.
  TRUSTED_ORIGINS: z.string().default('http://localhost:4321,http://localhost:3000'),
  // Set to the shared parent domain (e.g. `.themusicrepository.com`) when the web app and API run on
  // sibling subdomains, so the session cookie is shared across them. Unset for local dev.
  AUTH_COOKIE_DOMAIN: z.string().optional(),

  // Social identity providers. Each pair is optional — a provider is registered only when both its id and
  // secret are set, so the app boots locally with none configured. Register the callback
  // `${BETTER_AUTH_URL}/api/auth/callback/<provider>` in each provider's developer console.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  // Personal Microsoft accounts (`consumers` tenant); callback `.../api/auth/callback/microsoft`.
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  // Work/school (organizational) Microsoft accounts via Entra ID; callback
  // `.../api/auth/oauth2/callback/microsoft-entra-id`. `MICROSOFT_WORK_TENANT_ID` defaults to
  // `organizations` (any work/school directory); set a directory GUID to scope to one organization.
  MICROSOFT_WORK_CLIENT_ID: z.string().optional(),
  MICROSOFT_WORK_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_WORK_TENANT_ID: z.string().optional(),

  // Better Auth API rate limiting. Unset ⇒ on in production, off in development/test. Set 'true'/'false'
  // to force it. State persists in Postgres (the `rate_limit` table) so limits hold across instances.
  AUTH_RATE_LIMIT_ENABLED: z.enum(['true', 'false']).optional(),

  // Billing. When STRIPE_SECRET_KEY is set the Stripe checkout gateway is used; otherwise
  // the MockCheckoutGateway (dev/CI) — no keys, no charges. STRIPE_WEBHOOK_SECRET defaults to a
  // non-sensitive dev value the mock ignores. WEB_BASE_URL builds checkout success/cancel URLs.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_mock_dev_secret'),
  STRIPE_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  WEB_BASE_URL: z.string().default('http://localhost:4321'),

  // Support (Ko-fi). Shared token the Ko-fi webhook payload must carry to be accepted (from Ko-fi's
  // Advanced webhook settings). Optional so the app boots without it; an unset token rejects every
  // inbound webhook until configured.
  KOFI_VERIFICATION_TOKEN: z.string().optional(),

  // Mail. Unset SMTP_URL → the LogMailSender (dev/CI, logs instead of sending). Set a
  // connection string (e.g. smtps://user:pass@host:465) to switch to real SMTP delivery.
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('The Music Repository <no-reply@localhost>'),

  // Where contact-form submissions are delivered.
  CONTACT_RECIPIENT: z.string().default('michael.hewett.87@gmail.com'),

  // Cloudflare Turnstile secret for verifying the contact form's anti-bot token. Unset ⇒ verification
  // is skipped (local/dev). Set it (with the matching PUBLIC_TURNSTILE_SITE_KEY on the web) to enforce.
  TURNSTILE_SECRET_KEY: z.string().optional(),
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
