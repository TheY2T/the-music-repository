import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createMailTransport } from '../mail/create-mail-transport';
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

/**
 * Mail transport for account emails (password reset, email verification). Selects SMTP when `SMTP_URL`
 * is set, else logs the message (local dev). Built here from `process.env` because the auth instance is
 * module-scoped and doesn't participate in Nest DI — the same selection the `MailModule` factory makes.
 */
const mailer = createMailTransport({ smtpUrl: process.env.SMTP_URL, from: process.env.MAIL_FROM });

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
    // Sign-in is not gated on a verified email; flip once per-environment SMTP is provisioned.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await mailer.send({
        to: user.email,
        subject: 'Reset your password',
        text: `Someone requested a password reset for your account on The Music Repository.\n\nReset your password:\n${url}\n\nIf you didn't request this, you can ignore this email — your password stays the same.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await mailer.send({
        to: user.email,
        subject: 'Verify your email',
        text: `Welcome to The Music Repository. Confirm your email address:\n${url}`,
      });
    },
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
