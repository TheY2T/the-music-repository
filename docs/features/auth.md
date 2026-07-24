# Feature: Authentication & RBAC

- **Phase:** 1 (Slice 2a) · **Status:** shipped
- **Flag keys** (from `@TheY2T/tmr-flags`):
  - `auth.enabled` — gates the web auth entry points (sign-in / account links). Default on.
  - `auth.signup` — gates the self-service sign-up page + the "create an account" link. Default on.
  - `auth.social` — gates the Google social sign-in button. Default off (needs provider credentials to
    function).
  - `auth.facebook` — gates the Facebook social sign-in button. Default on (needs
    `FACEBOOK_CLIENT_ID`/`SECRET` to function); toggle off per-environment to hide the button.
  - `auth.microsoft` — gates the personal Microsoft account button (`consumers` tenant). Default on
    (needs `MICROSOFT_CLIENT_ID`/`SECRET` to function).
  - `auth.microsoft-work` — gates the work/school (organizational) Microsoft button (Entra ID). Default
    off; intended to switch on once classroom features land.
  - `auth.whatsapp` — gates the "Continue with WhatsApp" phone-OTP sign-in (ADR 0053). Default off (needs
    a provisioned WhatsApp Business sender + an approved template to function).
  - `auth.apple` — gates the "Sign in with Apple" button (ADR 0054). Default off (needs an Apple Developer
    Program membership + a Services ID and signing key to function).

## Purpose

The people layer: sign in, know who the acting user is, and authorize actions by **permission** so the
admin CMS (2b) and favorites (2c) can be gated. Users sign up and sign in with email/password (email
verified before first sign-in) or with a Google or Facebook identity (ADR 0013, ADR 0050).

## UX behaviour

- `/signin` — email/password form (React island) with dev-account quick-fill, a **Forgot password?**
  link, a **Create an account** link (when `auth.signup`), and social sign-in buttons (each gated by its
  own provider flag — `auth.social`, `auth.facebook`, `auth.microsoft`, `auth.microsoft-work`,
  `auth.apple`, `auth.whatsapp`). On success → `?redirect` target (default `/admin`).
- `/signup` — name/email/password form (when `auth.signup`; else redirects to `/signin`). On success a
  verification email is sent and the form shows a "check your email" confirmation — the account can't
  sign in until the address is verified. Social buttons appear per provider flag (`auth.social`,
  `auth.facebook`, `auth.microsoft`, `auth.microsoft-work`, `auth.apple`, `auth.whatsapp`). Anonymous only.
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
`GET /api/auth/callback/<provider>`, `POST /api/auth/sign-in/oauth2` + its callback
`GET /api/auth/oauth2/callback/<providerId>` (generic-OAuth providers),
`GET /api/auth/get-session`, `POST /api/auth/sign-out`, and the
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

## Social sign-in (Google, Facebook, Microsoft, Apple)

Configured in `apps/api/src/auth/better-auth.ts`; each provider is registered only when its credentials
are set, so leaving them unset simply hides that button. `SocialSignInButtons` (`@TheY2T/tmr-common-ui`)
renders one button per provider using the `SocialButton` brand-mark component (`@TheY2T/tmr-ui`), gated
per provider by the `showSocial` / `showMicrosoft` / `showMicrosoftWork` props the sign-in and sign-up
pages derive from the flags.

- **Callback URI** (register in each provider's developer console):
  `${BETTER_AUTH_URL}/api/auth/callback/<google|facebook|microsoft|apple>` for the built-in social
  providers (Apple returns via `form_post`, a POST to that URL), and
  `${BETTER_AUTH_URL}/api/auth/oauth2/callback/microsoft-entra-id` for work/school Microsoft.
- **Google / Facebook** — built-in `socialProviders`; the browser calls
  `authClient.signIn.social({ provider, callbackURL })`. Set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
  and `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET`.
- **Account linking** — `account.accountLinking.enabled` links a sign-in to an existing account when the
  provider reports the email verified; `trustedProviders: ['google']` additionally links Google without a
  verification check. Facebook, both Microsoft flows, and Apple use the verified-email path only (Apple's
  private-relay addresses make trusted linking unsafe).

### Microsoft (personal vs work/school)

Microsoft sign-in is two independent flows behind two flags, so personal accounts can go live before
work/school (ADR 0052). Personal defaults on and work/school defaults off; each provider registers only
when its own credentials are set, so the flag being on with no credentials shows a button that errors on
click rather than a working sign-in.

- **Personal accounts** (`auth.microsoft`) — the built-in `microsoft` social provider with
  `tenantId: 'consumers'`, accepting @outlook/@hotmail/@live accounts. Started via
  `authClient.signIn.social({ provider: 'microsoft' })`; callback `.../api/auth/callback/microsoft`.
  Set `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`.
- **Work/school (organizational) accounts** (`auth.microsoft-work`) — the generic-OAuth
  `microsoftEntraId` provider (providerId `microsoft-entra-id`) with `tenantId` from
  `MICROSOFT_WORK_TENANT_ID` (default `organizations`; a directory GUID scopes sign-in to one
  organization). Started via `authClient.signIn.oauth2({ providerId: 'microsoft-entra-id' })` — the
  `genericOAuth` server plugin + the `genericOAuthClient` browser plugin surface this. Callback
  `.../api/auth/oauth2/callback/microsoft-entra-id`. Set `MICROSOFT_WORK_CLIENT_ID` /
  `MICROSOFT_WORK_CLIENT_SECRET` (+ optional `MICROSOFT_WORK_TENANT_ID`).

**Azure setup** — two separate app registrations in Microsoft Entra ID:
- *Personal*: supported account types "Personal Microsoft accounts only"; redirect URI
  `${BETTER_AUTH_URL}/api/auth/callback/microsoft`.
- *Work/school*: "Accounts in any organizational directory"; redirect URI
  `${BETTER_AUTH_URL}/api/auth/oauth2/callback/microsoft-entra-id`.
Each app gets a client secret; store the values locally in `.env` and per environment in Render's `dev`
group. A provider only registers when its credentials are present, so verify a flow against a real Azure
app registration (a flag on with no credentials shows a button that errors on click).

Full step-by-step — Azure app registration, publisher verification, and the Partner Center
identity-verification gotchas — is in
[`docs/runbooks/microsoft-oauth-setup.md`](../runbooks/microsoft-oauth-setup.md).

### Apple (Sign in with Apple)

Apple sign-in (`auth.apple`, default off; ADR 0054) is a one-click OAuth button like Google/Facebook —
`authClient.signIn.social({ provider: 'apple' })`, callback `.../api/auth/callback/apple`. It differs from
the other providers in two ways handled in code:

- **Client secret is a signed JWT, not a static string.** Apple's OAuth `client_secret` is a short-lived
  ES256 JWT signed with the account's Sign in with Apple key. `apps/api/src/auth/create-apple-client-secret.ts`
  builds it with `node:crypto` (no JWT library) and hands `better-auth.ts` a self-refreshing value that
  regenerates before it expires, so the secret never needs manual rotation. The provider registers only
  when all of `APPLE_CLIENT_ID` (the Services ID), `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`
  (the `.p8` PEM, `\n`-escaped for single-line storage) are set.
- **Profile data.** Apple returns the user's name only on the **first** authorization and the email is
  often a private-relay address; Better Auth's Apple provider captures the first-authorization name and
  accepts the relay email, so no custom profile mapping is needed. Apple is intentionally **not** a trusted
  linking provider (relay emails make trusted linking unsafe).

- **Apple posts the callback (`response_mode=form_post`).** The browser POSTs `.../api/auth/callback/apple`
  with `Origin: https://appleid.apple.com`, so `better-auth.ts` adds that origin to `trustedOrigins` when
  Apple is configured — otherwise Better Auth rejects the callback with `INVALID_ORIGIN`.
- **Domain verification is on the API domain.** Better Auth builds the redirect_uri from `BETTER_AUTH_URL`
  (the API, `api.<site>`), so Apple must have **`api.<site>`** — not the web/apex domain — registered on the
  Services ID, with the exact Return URL `.../api/auth/callback/apple`. Sign in with Apple for the Web no
  longer requires hosting a domain-association file (per Apple's current docs), so there's no `.well-known`
  document to serve. Registering the apex domain instead of `api.<site>` yields **"Invalid client id or web
  redirect url"** at sign-in.

Apple disallows `localhost` return URLs, so the full callback round-trip is verified on the deployed HTTPS
environment rather than locally; local dev confirms the button renders and starts the redirect. Full
step-by-step — App ID, Services ID, signing key, domain verification, and the env vars — is in
[`docs/runbooks/apple-oauth-setup.md`](../runbooks/apple-oauth-setup.md).

## WhatsApp (phone OTP)

Passwordless phone sign-in over WhatsApp (`auth.whatsapp`, default off; ADR 0053). The learner enters a
phone number, receives a one-time code on WhatsApp, and verifying it signs them in — creating an account
on first use. Built on Better Auth's `phoneNumber` plugin; unlike the redirect-based social buttons it's
a two-step flow, so it renders as a dedicated `WhatsAppSignIn` island (`@TheY2T/tmr-common-ui`) that steps
number → code inline, gated by the `showWhatsapp` prop the sign-in/sign-up pages derive from the flag.

- **Client** — `authClient.phoneNumber.sendOtp({ phoneNumber })` then
  `authClient.phoneNumber.verify({ phoneNumber, code })` (the `phoneNumberClient` browser plugin in
  `@TheY2T/tmr-web-acl`). Verifying establishes the session; there is no phone password.
- **Account creation** — `signUpOnVerification` creates the account on first verify with a placeholder
  `<digits>@whatsapp.local` email and the number as the name (completable later).
- **Delivery** — the `sendOTP` callback calls a `WhatsAppSender` (ADR 0012): `CloudApiWhatsAppSender`
  posts an approved AUTHENTICATION-category template with a copy-code button to the WhatsApp Business
  Cloud API when a sender is configured (`WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` +
  `WHATSAPP_OTP_TEMPLATE_NAME`), else `LogWhatsAppSender` logs the code (dev/CI). The `WhatsAppModule`
  binds the port; `better-auth.ts` builds the same transport from `process.env` (it runs outside Nest DI).
- **Endpoint exposure** — the `phoneNumber` plugin registers when a sender is configured **or** outside
  production, so local dev / CI can run the flow through the log adapter (the code prints to the API log)
  while production only exposes the endpoints once a sender exists. The user-facing gate stays the flag.
- **Schema** — the plugin's `phone_number` (unique) + `phone_number_verified` columns are hand-added to
  the `user` table in `auth-schema.ts` (drizzle-kit owns the migration).
- **Delivery note** — authentication-template messages reach only the user's **primary** WhatsApp device;
  linked devices show a masked prompt.

Full step-by-step — WhatsApp Business number, an approved authentication template, and the env vars — is
in [`docs/runbooks/whatsapp-otp-setup.md`](../runbooks/whatsapp-otp-setup.md).

## API rate limiting

Better Auth's built-in `rateLimit` (in `better-auth.ts`) with `storage: 'database'` (the `rate_limit`
table) so counters persist across instances and restarts. Global 60s/100-request window plus tighter
`customRules` (5/60s) on `/sign-in/email`, `/sign-up/email`, `/forget-password`, and
`/phone-number/send-otp`. Keys derive from the
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
- **Setup:** `pnpm infra:up`, `pnpm --filter @TheY2T/tmr-api db:migrate && db:seed:auth`, then run both
  apps. Dev accounts: `admin|editor|learner@local.dev` / `password123` (local only).
