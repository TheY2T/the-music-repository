# ADR 0050 — Social identity providers, auth rate limiting, and self-service sign-up

- **Status:** Accepted
- **Date:** 2026-07
- **Context:** Auth (ADR 0013) shipped email/password sign-in plus password-reset and
  email-verification flows, but three pieces were outstanding: users could not sign in with a social
  identity provider, there was no public sign-up page (accounts were created only by the seed script),
  and the Better Auth API had no rate limiting (explicitly deferred). Better Auth provides all three as
  configuration, so this is a config + UI change, not new backend architecture — auth stays at the
  presentation edge and outside the TypeSpec.
- **Decision:**
  - **Social providers (Google, Facebook).** Configured under `socialProviders` in
    `apps/api/src/auth/better-auth.ts`, each registered only when its credentials are present so local
    dev and CI boot with none set. Callbacks follow `${BETTER_AUTH_URL}/api/auth/callback/<provider>`.
    **Apple was considered but deferred:** Sign in with Apple requires the paid Apple Developer Program
    membership (an annual fee) plus domain-association verification and a signed-JWT client secret, so it
    is out of scope until that cost is justified. The provider set is open — adding Apple later is a
    config-only change (register its provider + credentials; no UI change).
  - **Account linking.** `account.accountLinking.enabled` links a social sign-in to an existing account
    when the provider reports the email as verified. `trustedProviders: ['google']` additionally links
    Google without a verification check (it reliably verifies email); Facebook is left to the
    verified-email path only, since Better Auth flags trusted linking as an account-takeover risk.
  - **API rate limiting → Postgres.** Better Auth's built-in `rateLimit` with `storage: 'database'`
    (the hand-written `rate_limit` table, so drizzle-kit still owns migrations) persists counters across
    instances and restarts. A global 60s/100 window plus tighter `customRules` (5/60s) on
    `/sign-in/email`, `/sign-up/email`, and `/forget-password`. Behind Cloudflare→Render,
    `advanced.ipAddress.ipAddressHeaders` keys limits off `cf-connecting-ip` (then `x-forwarded-for`)
    rather than the proxy address. It's env-driven (`AUTH_RATE_LIMIT_ENABLED`), defaulting on in
    production and off in development/test so the seed script and E2E runs don't trip limits — it can't
    read the async DB-backed flag snapshot at construction time, so it is not a feature flag.
  - **Self-service sign-up + required verification.** A `SignUpForm` island (`@TheY2T/tmr-common-ui`)
    and `/signup` route call `signUp.email`; `emailAndPassword.requireEmailVerification` is now `true`,
    so a new account must confirm its email before signing in. The seed script marks dev accounts
    `emailVerified: true` so local logins keep working.
  - **Flags.** `auth.signup` (default on) gates the sign-up page and its link; `auth.social` (default
    off, since it needs real provider credentials) gates the social buttons on the sign-in/sign-up forms.
  - **Provider brand marks.** Google/Facebook logos aren't in the Lucide set and must keep each
    provider's colours/shape to be recognisable, so the `SocialButton` (`@TheY2T/tmr-ui`) uses inline
    brand SVGs — the same notation-style exception to the "icons come from the Icon atom" rule.
- **Consequences:**
  - Provider credentials and `AUTH_RATE_LIMIT_ENABLED` are env-driven: secrets live in Render's `dev`
    group, documented in `.env.example`. Each provider also needs a developer-console app with the
    callback URI registered; OAuth round-trips can't be completed locally without one. Google's OAuth
    client is free; Facebook Login is free (public use needs business verification).
  - Requiring email verification is a behaviour change: any pre-existing unverified account can't sign in
    until verified (acceptable for the private dev environment).
- **Supersedes:** none. Extends ADR 0013 (auth architecture); relies on ADR 0035 (DB-backed flags) and
  ADR 0049 (Render/Cloudflare/Resend hosting + cross-subdomain cookie).
