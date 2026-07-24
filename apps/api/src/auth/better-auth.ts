import { type BetterAuthPlugin, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, phoneNumber } from 'better-auth/plugins';
import { genericOAuth, microsoftEntraId } from 'better-auth/plugins/generic-oauth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createMailTransport } from '../mail/create-mail-transport';
import { createWhatsAppTransport } from '../whatsapp/create-whatsapp-sender';
import { ac, roles } from './access-control';
import * as authSchema from './auth-schema';
import { createAppleClientSecret } from './create-apple-client-secret';

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
 * WhatsApp OTP transport for phone-number sign-in. Sends via the WhatsApp Business Cloud API when a
 * sender is configured (token + phone-number id + an approved template), else logs the code (local dev).
 * Built here from `process.env` for the same reason as the mailer — the auth instance is module-scoped
 * and outside Nest DI, so it can't inject the `WhatsAppSender` port the `WhatsAppModule` binds.
 */
const whatsappSender = createWhatsAppTransport({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  templateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME,
  templateLang: process.env.WHATSAPP_TEMPLATE_LANG,
  graphVersion: process.env.WHATSAPP_GRAPH_VERSION,
});

/**
 * Social identity providers. Each provider is registered only when its credentials are present, so local
 * dev and CI boot with no OAuth secrets. The callback each provider must be configured to return to is
 * `${BETTER_AUTH_URL}/api/auth/callback/{google|facebook|microsoft|apple}` (Apple returns via `form_post`,
 * a POST to that URL). Microsoft here is the personal account flow (`consumers` tenant); work/school
 * sign-in is a separate generic-OAuth provider registered below, with its own callback at
 * `${BETTER_AUTH_URL}/api/auth/oauth2/callback/microsoft-entra-id`.
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

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  socialProviders.microsoft = {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    // Personal Microsoft accounts (@outlook/@hotmail/@live) only.
    tenantId: 'consumers',
  };
}

/**
 * Apple's client secret is a short-lived ES256 JWT signed with the Sign in with Apple key, so `clientId`
 * (the Services ID) pairs with a self-refreshing secret rather than a fixed string. Better Auth reads
 * `clientSecret` at each token exchange, so the getter hands back a token that's rotated automatically
 * before it expires. Apple returns the user's name only on the first authorization and the email is often
 * a private-relay address; Better Auth's Apple provider captures both, so no profile mapping is needed.
 */
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
) {
  const appleClientSecret = createAppleClientSecret({
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
  });
  socialProviders.apple = {
    clientId: process.env.APPLE_CLIENT_ID,
    get clientSecret() {
      return appleClientSecret.value;
    },
  };
  // Apple returns via `response_mode=form_post`, so the browser POSTs the callback with
  // `Origin: https://appleid.apple.com`. Better Auth's origin check rejects it as INVALID_ORIGIN unless
  // Apple's origin is trusted, so add it when Apple is configured.
  trustedOrigins.push('https://appleid.apple.com');
}

/**
 * Sign-in providers registered as Better Auth plugins. Work/school (organizational) Microsoft accounts
 * use the Entra ID generic-OAuth provider — a separate flow from personal accounts above, registered
 * only when its own credentials are present. `MICROSOFT_WORK_TENANT_ID` accepts `organizations` (any
 * work/school directory, the default), `common`, or a specific directory (GUID) to scope sign-in to one
 * organization.
 */
const plugins: BetterAuthPlugin[] = [
  admin({
    ac,
    roles,
    defaultRole: 'learner',
    adminRoles: ['admin'],
  }),
];

if (process.env.MICROSOFT_WORK_CLIENT_ID && process.env.MICROSOFT_WORK_CLIENT_SECRET) {
  plugins.push(
    genericOAuth({
      config: [
        microsoftEntraId({
          clientId: process.env.MICROSOFT_WORK_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_WORK_CLIENT_SECRET,
          tenantId: process.env.MICROSOFT_WORK_TENANT_ID ?? 'organizations',
        }),
      ],
    }),
  );
}

/**
 * WhatsApp phone-OTP sign-in. Passwordless: the user requests a code, and verifying it signs them in —
 * creating an account on first use (`signUpOnVerification` derives a placeholder email/name from the
 * number, which they can complete later). Whether the "Continue with WhatsApp" button is shown is gated
 * separately by the `auth.whatsapp` flag in the web app. The plugin registers when a real sender is
 * configured, and also outside production so local dev / CI can exercise the flow through the log
 * transport (the code is written to the API log). The user-facing gate stays the flag; production only
 * exposes the endpoints once a sender exists.
 */
const whatsappConfigured = Boolean(
  process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_OTP_TEMPLATE_NAME,
);
if (whatsappConfigured || process.env.NODE_ENV !== 'production') {
  plugins.push(
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/\D/g, '')}@whatsapp.local`,
        getTempName: (phone) => phone,
      },
      sendOTP: async ({ phoneNumber: to, code }) => {
        await whatsappSender.send({ to, code });
      },
    }),
  );
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
    // `trustedProviders` additionally links Google without a verification check (Google reliably verifies
    // email); other providers — Facebook, both Microsoft flows, and Apple — are left to the verified-email
    // path (Better Auth flags trusted linking as an account-takeover risk, and Apple emails are often
    // private-relay addresses).
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
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
      '/phone-number/send-otp': { window: 60, max: 5 },
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
  plugins,
});

export type Auth = typeof auth;
