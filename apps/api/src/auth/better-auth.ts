import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ac, roles } from './access-control';
import * as authSchema from './auth-schema';

/**
 * Better Auth lives at the presentation edge only (an adapter + guard). The domain never imports it —
 * the core sees the `CurrentUser` port (see `current-user.ts`).
 *
 * Config is module-scoped (the `@better-auth/cli` and the `@thallesp/nestjs-better-auth` module both
 * consume this exported `auth`), so it reads `process.env` directly with local-dev fallbacks rather
 * than Nest's `ConfigService`. `@nestjs/config` has populated `process.env` from `.env` by the time the
 * first request hits Better Auth; `postgres-js` connects lazily, so the standalone client is safe.
 */
const databaseUrl = process.env.DATABASE_URL ?? 'postgres://tmr:tmr@localhost:5432/tmr';
const client = postgres(databaseUrl, { max: 3 });
const db = drizzle(client, { schema: authSchema });

const trustedOrigins = (
  process.env.TRUSTED_ORIGINS ?? 'http://localhost:4321,http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-insecure-secret-change-me-please-32chars',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  basePath: '/api/auth',
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    // Dev: no email delivery wired yet, so don't gate sign-in on verification.
    requireEmailVerification: false,
  },
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: 'learner',
      adminRoles: ['admin'],
    }),
  ],
});

export type Auth = typeof auth;
