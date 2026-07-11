# Feature: Authentication & RBAC

- **Phase:** 1 (Slice 2a) · **Status:** shipped
- **Flag key:** `auth.enabled` (from `@TheY2T/tmr-flags`) — gates the web auth entry points (sign-in /
  account links). Default on.

## Purpose

The people layer: sign in, know who the acting user is, and authorize actions by **permission** so the
admin CMS (2b) and favorites (2c) can be gated. Email/password now (dev); Google/Microsoft later as
config-only (ADR 0013).

## UX behaviour

- `/signin` — email/password form (React island) with dev-account quick-fill. On success →
  `?redirect` target (default `/admin`).
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
`GET /api/auth/get-session`, `POST /api/auth/sign-out`. Our thin surface:

- `GET /me` — current session (`@RequireAuth()`); 401 problem+json when anonymous.
- `GET /me/permissions/publish` — RBAC smoke probe (`@RequirePermissions({ content:['publish'] })`):
  401 anonymous / 403 learner / 200 editor+admin.

Authorization uses the permission-based roles in `src/auth/access-control.ts`. Use-cases read the user
via the `CurrentUser` port (never `better-auth`).

## Help topics

None yet (Info View arrives in Phase 2).

## Tests

- **Backend (curl / e2e):** anonymous `/me` → 401 `problem+json` with `traceId`; sign in per role and
  hit `/me/permissions/publish` → 403 (learner) / 200 (editor, admin); public `/catalogue/items`
  stays 200 anonymous.
- **Web (browser):** anonymous `/admin` → redirect to `/signin`; sign in as editor → `/admin` renders
  with `role: editor`; sign out → back to `/signin` and `/admin` re-gates.
- **Setup:** `pnpm infra:up`, `pnpm --filter @TheY2T/tmr-api db:migrate && db:seed:auth`, then run both
  apps. Dev accounts: `admin|editor|learner@local.dev` / `password123` (local only).
