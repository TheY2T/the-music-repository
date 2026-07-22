# Feature: Authentication & RBAC

- **Phase:** 1 (Slice 2a) · **Status:** shipped
- **Flag keys** (from `@TheY2T/tmr-flags`):
  - `auth.enabled` — gates the web auth entry points (sign-in / account links). Default on.
  - `auth.signup` — gates the self-service sign-up page + the "create an account" link. Default on.
  - `auth.social` — gates the social sign-in buttons (Google/Facebook/Apple). Default off (needs
    provider credentials to function).

## Purpose

The people layer: sign in, know who the acting user is, and authorize actions by **permission** so the
admin CMS (2b) and favorites (2c) can be gated. Users sign up and sign in with email/password (email
verified before first sign-in) or with a Google, Facebook, or Apple identity (ADR 0013, ADR 0050).

## UX behaviour

- `/signin` — email/password form (React island) with dev-account quick-fill, a **Forgot password?**
  link, a **Create an account** link (when `auth.signup`), and social sign-in buttons (when
  `auth.social`). On success → `?redirect` target (default `/admin`).
- `/signup` — name/email/password form (when `auth.signup`; else redirects to `/signin`). On success a
  verification email is sent and the form shows a "check your email" confirmation — the account can't
  sign in until the address is verified. Social buttons appear when `auth.social`. Anonymous only.
- `/forgot-password` — enter an email to request a reset link. The confirmation is neutral (it never
  reveals whether an account exists). Anonymous only.
- `/reset-password?token=…` — set a new password from the emailed link; on success → `/signin`. Missing or
  expired tokens show an invalid-link message with a link to request a new one.
- `/verify-email` — request a fresh email-verification link (also neutral).
- `/admin` — SSR session-gated; anonymous visitors are redirected to `/signin?redirect=/admin`.
  Shows the signed-in user + role and a sign-out control. (Full CMS arrives in 2b.)
- Home page shows **Sign in** (anonymous) or **name · Admin** (authenticated) when `auth.enabled`.
- The gate is UX-only; the API re-authorizes every request.

## Data model

Better Auth tables in `apps/api/src/auth/auth-schema.ts` (re-exported from the main Drizzle schema):
`user` (+ admin fields `role`/`banned`/`ban_reason`/`ban_expires`), `session` (+ `impersonated_by`),
`account` (credential hash + OAuth provider links — one row per linked social identity), `verification`,
and `rate_limit` (API rate-limit counters — `key`/`count`/`last_request`). IDs are `text`. The core auth
tables live in the squashed baseline migration; `rate_limit` is added in `drizzle/0002_*`. drizzle-kit
owns all of them (never run `better-auth migrate`).

## API contract

Better Auth owns `/api/auth/*` (**not** in our TypeSpec) — e.g. `POST /api/auth/sign-up/email`,
`POST /api/auth/sign-in/email`, `POST /api/auth/sign-in/social` + the OAuth callback
`GET /api/auth/callback/<provider>`, `GET /api/auth/get-session`, `POST /api/auth/sign-out`, and the
password-reset / email-verification routes: `POST /api/auth/request-password-reset`,
`POST /api/auth/reset-password`, `POST /api/auth/send-verification-email`, `GET /api/auth/verify-email`.
Our thin surface:

- `GET /me` — current session (`@RequireAuth()`); 401 problem+json when anonymous.
- `GET /me/permissions/publish` — RBAC smoke probe (`@RequirePermissions({ content:['publish'] })`):
  401 anonymous / 403 learner / 200 editor+admin.

Authorization uses the permission-based roles in `src/auth/access-control.ts`. Use-cases read the user
via the `CurrentUser` port (never `better-auth`).

## Password reset & email verification

Reset and verification tokens are handled by Better Auth and stored in the `verification` table (no extra
schema). Delivery is wired in `apps/api/src/auth/better-auth.ts`:

- `emailAndPassword.sendResetPassword` emails the reset link; the browser calls
  `requestPasswordReset({ email, redirectTo })` (surfaced from `@TheY2T/tmr-web-acl/auth-client`), so the
  link lands on the web app's `/reset-password?token=…`. `resetPassword({ newPassword, token })` completes it.
- `emailVerification.sendVerificationEmail` (with `sendOnSignUp` + `autoSignInAfterVerification`) emails the
  verification link; `/verify-email` resends via `sendVerificationEmail({ email, callbackURL })`.
- Both callbacks deliver through the shared mail transport (`apps/api/src/mail/create-mail-transport.ts`) —
  SMTP when `SMTP_URL` is set, otherwise the message is logged (dev/CI). `MAIL_FROM` sets the sender.
- `requireEmailVerification` is `true`: a new account must confirm its email before it can sign in
  (verification is sent on sign-up). The seed script marks dev accounts `emailVerified: true` so local
  logins work without a live inbox.

The three recovery forms (`ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailNotice`) live in
`@TheY2T/tmr-common-ui` and report outcomes neutrally to avoid account enumeration. `SignUpForm` (also in
common-ui) creates accounts and shows the verify-email confirmation.

## Social sign-in (Google, Facebook, Apple)

Configured under `socialProviders` in `apps/api/src/auth/better-auth.ts`; each provider is registered only
when its credentials are set, so leaving them unset simply hides that button. The browser calls
`authClient.signIn.social({ provider, callbackURL })` from the shared `SocialSignInButtons`
(`@TheY2T/tmr-common-ui`), rendered with the `SocialButton` brand-mark component (`@TheY2T/tmr-ui`).

- **Callback URI** (register in each provider's developer console):
  `${BETTER_AUTH_URL}/api/auth/callback/<google|facebook|apple>`.
- **Google / Facebook** — set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and
  `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET`.
- **Apple (Sign in with Apple)** — create an App ID, a **Services ID** (→ `APPLE_CLIENT_ID`), and a **Key**
  with Sign in with Apple enabled (download the `.p8` once → `APPLE_PRIVATE_KEY`, with `APPLE_TEAM_ID` +
  `APPLE_KEY_ID`). The client secret is a short-lived ES256 JWT minted from the `.p8` at runtime
  (`apps/api/src/auth/apple-client-secret.ts`); `https://appleid.apple.com` is auto-added to
  `trustedOrigins`. `APPLE_APP_BUNDLE_IDENTIFIER` is only needed for native iOS. The `.p8` may be stored
  with literal `\n` escapes.
- **Account linking** — `account.accountLinking.enabled` links a social sign-in to an existing account
  when the provider reports the email verified; `trustedProviders: ['google', 'apple']` additionally links
  those without a verification check. Facebook uses the verified-email path only.

## API rate limiting

Better Auth's built-in `rateLimit` (in `better-auth.ts`) with `storage: 'database'` (the `rate_limit`
table) so counters persist across instances and restarts. Global 60s/100-request window plus tighter
`customRules` (5/60s) on `/sign-in/email`, `/sign-up/email`, and `/forget-password`. Keys derive from the
real client IP via `advanced.ipAddress.ipAddressHeaders` (`cf-connecting-ip`, then `x-forwarded-for`)
behind Cloudflare→Render. Toggled by `AUTH_RATE_LIMIT_ENABLED` (unset ⇒ on in production, off in
development/test).

## Help topics

None yet (Info View arrives in Phase 2).

## Tests

- **Backend (curl / e2e):** anonymous `/me` → 401 `problem+json` with `traceId`; sign in per role and
  hit `/me/permissions/publish` → 403 (learner) / 200 (editor, admin); public `/catalogue/items`
  stays 200 anonymous.
- **Web (browser):** anonymous `/admin` → redirect to `/signin`; sign in as editor → `/admin` renders
  with `role: editor`; sign out → back to `/signin` and `/admin` re-gates.
- **Password reset:** unit tests for the three islands (`ForgotPasswordForm`/`ResetPasswordForm`/
  `VerifyEmailNotice`) + the mail transport (`create-mail-transport.test.ts`); E2E `password-reset.spec.ts`
  covers request → confirmation, reset → `/signin`, missing-token, and the signin link.
- **Sign-up & social:** `SignUpForm.test.tsx` (create → verify-email confirmation, error path, social
  buttons gated + provider OAuth start); E2E `signup.spec.ts` (sign-up → confirmation, signin→signup link).
- **Apple client secret:** `apple-client-secret.test.ts` — the minted JWT is ES256, carries the key id,
  and verifies against the public key with Apple-shaped `iss`/`sub`/`aud` claims.
- **Setup:** `pnpm infra:up`, `pnpm --filter @TheY2T/tmr-api db:migrate && db:seed:auth`, then run both
  apps. Dev accounts: `admin|editor|learner@local.dev` / `password123` (local only).
