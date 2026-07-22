import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createMailTransport } from '../mail/create-mail-transport';
import { ac, roles } from './access-control';
import { generateAppleClientSecret } from './apple-client-secret';
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

/**
 * Social identity providers. Each provider is registered only when its credentials are present, so local
 * dev and CI boot with no OAuth secrets. The callback each provider must be configured to return to is
 * `${BETTER_AUTH_URL}/api/auth/callback/{google|facebook|apple}`.
 */
const socialProviders: Record<string, unknown> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  socialProviders.facebook = {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  };
}

/**
 * Sign in with Apple. Apple's client secret is a short-lived ES256 JWT signed with the `.p8` private key
 * (not a static value), so the provider is an async factory that mints the secret at config-resolution
 * time. `APPLE_PRIVATE_KEY` is the `.p8` contents; on hosts that can't store literal newlines it may carry
 * `\n` escapes, which are restored before signing. Apple POSTs the callback as `form_post`, so
 * `https://appleid.apple.com` must be a trusted origin.
 */
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
) {
  const appleClientId = process.env.APPLE_CLIENT_ID;
  const appleTeamId = process.env.APPLE_TEAM_ID;
  const appleKeyId = process.env.APPLE_KEY_ID;
  const applePrivateKey = process.env.APPLE_PRIVATE_KEY;
  const appleBundleId = process.env.APPLE_APP_BUNDLE_IDENTIFIER;
  socialProviders.apple = async () => ({
    clientId: appleClientId,
    clientSecret: await generateAppleClientSecret({
      clientId: appleClientId,
      teamId: appleTeamId,
      keyId: appleKeyId,
      privateKey: applePrivateKey,
    }),
    ...(appleBundleId ? { appBundleIdentifier: appleBundleId } : {}),
  });
  if (!trustedOrigins.includes('https://appleid.apple.com')) {
    trustedOrigins.push('https://appleid.apple.com');
  }
}

/**
 * Rate limiting is a boot-time construction option (it can't wait on the async DB-backed flag snapshot),
 * so it's env-driven: explicitly by `AUTH_RATE_LIMIT_ENABLED`, otherwise on in production and off in
 * development/test (so the seed script and E2E runs don't trip limits). State is stored in Postgres via
 * the Drizzle adapter (the `rate_limit` table) so limits hold across instances and restarts.
 */
const rateLimitEnabled =
  process.env.AUTH_RATE_LIMIT_ENABLED != null
    ? process.env.AUTH_RATE_LIMIT_ENABLED === 'true'
    : process.env.NODE_ENV === 'production';

/**
 * When the web app and API run on sibling subdomains (e.g. `themusicrepository.com` +
 * `api.themusicrepository.com`), set `AUTH_COOKIE_DOMAIN=.themusicrepository.com` so the session cookie
 * is shared across them (`SameSite=None; Secure`). Unset for local dev, where the default host-only,
 * lax cookie over http works. Behind Cloudflare→Render, rate-limit keys derive from the real client IP
 * via `cf-connecting-ip` rather than the proxy address.
 */
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim();
const advanced = {
  ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] },
  ...(cookieDomain
    ? {
        crossSubDomainCookies: { enabled: true, domain: cookieDomain },
        defaultCookieAttributes: { sameSite: 'none' as const, secure: true },
      }
    : {}),
};

export const auth = betterAuth({
  advanced,
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-insecure-secret-change-me-please-32chars',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  basePath: '/api/auth',
  trustedOrigins,
  socialProviders,
  account: {
    // Link a social sign-in to an existing account when the provider reports the email as verified.
    // `trustedProviders` additionally links Google/Apple without a verification check — both reliably
    // verify email; other providers are left to the verified-email path (Better Auth flags trusted
    // linking as an account-takeover risk).
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'apple'],
    },
  },
  rateLimit: {
    enabled: rateLimitEnabled,
    window: 60,
    max: 100,
    storage: 'database',
    modelName: 'rateLimit',
    // Tighter limits on the credential-bearing endpoints most attractive to brute force / abuse.
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/forget-password': { window: 60, max: 5 },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    // A new account must confirm its email (verification is sent on sign-up) before it can sign in.
    requireEmailVerification: true,
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
