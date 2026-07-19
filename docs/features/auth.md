# Feature: Authentication & RBAC

- **Phase:** 1 (Slice 2a) · **Status:** shipped
- **Flag key:** `auth.enabled` (from `@TheY2T/tmr-flags`) — gates the web auth entry points (sign-in /
  account links). Default on.

## Purpose

The people layer: sign in, know who the acting user is, and authorize actions by **permission** so the
admin CMS (2b) and favorites (2c) can be gated. Email/password now (dev); Google/Microsoft later as
config-only (ADR 0013).

## UX behaviour

- `/signin` — email/password form (React island) with dev-account quick-fill and a **Forgot password?**
  link. On success → `?redirect` target (default `/admin`).
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
`account` (credential hash + future OAuth links), `verification`. IDs are `text`. Migration
`drizzle/0002_*`.

## API contract

Better Auth owns `/api/auth/*` (**not** in our TypeSpec) — e.g. `POST /api/auth/sign-in/email`,
`GET /api/auth/get-session`, `POST /api/auth/sign-out`, and the password-reset /
email-verification routes: `POST /api/auth/request-password-reset`, `POST /api/auth/reset-password`,
`POST /api/auth/send-verification-email`, `GET /api/auth/verify-email`. Our thin surface:

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
- `requireEmailVerification` stays `false`: sign-in is not gated on a verified email until per-environment
  SMTP is provisioned. Flip it once delivery is live.

The three forms (`ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailNotice`) live in
`@TheY2T/tmr-common-ui` and report outcomes neutrally to avoid account enumeration.

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
- **Setup:** `pnpm infra:up`, `pnpm --filter @TheY2T/tmr-api db:migrate && db:seed:auth`, then run both
  apps. Dev accounts: `admin|editor|learner@local.dev` / `password123` (local only).
