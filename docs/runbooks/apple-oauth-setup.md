# Runbook: Set up Sign in with Apple

A step-by-step, replayable record of standing up **Sign in with Apple** for The Music Repository. The
design rationale lives in [`docs/features/auth.md`](../features/auth.md) and
[ADR 0054](../adr/0054-sign-in-with-apple.md); this is the *procedure* plus the Apple-side gotchas.

> **Read the [Gotchas](#gotchas--lessons-learned) section first.** The blockers here are almost all on the
> Apple side (Services ID vs App ID, the signed-JWT client secret, domain verification, the `localhost`
> restriction), not in the code.

## What you get

- A **"Continue with Apple"** button on `/signin` + `/signup`, behind flag `auth.apple` (**default off**).

The provider registers only when all four Apple env vars are set, so the button appears but only *works*
once the Apple identifiers, signing key, and env vars exist and the flag is on.

## Prerequisites

- A paid **Apple Developer Program** membership (Sign in with Apple is not available on a free account).
- Access to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**.
- Access to set env vars locally (`.env`) and in the Render **`dev`** env group.
- The site's public HTTPS domain (Apple rejects `localhost` return URLs).

## Target values (what Apple must match)

These come straight from `apps/api/src/auth/better-auth.ts` / `create-apple-client-secret.ts`.
`BETTER_AUTH_URL` is `http://localhost:3000` locally and `https://api.themusicrepository.com` on Render.

| | Value |
|---|---|
| Better Auth provider | built-in `apple` (one-click social) |
| Return URL (prod) | `https://api.themusicrepository.com/api/auth/callback/apple` |
| Response mode | `form_post` (Apple POSTs the callback) |
| `APPLE_CLIENT_ID` | the **Services ID** (e.g. `com.themusicrepository.web`) |
| `APPLE_TEAM_ID` | your 10-char Apple **Team ID** |
| `APPLE_KEY_ID` | the **Key ID** of the Sign in with Apple key |
| `APPLE_PRIVATE_KEY` | the `.p8` private key PEM (`\n`-escaped for single-line storage) |

> The Return URL must be HTTPS and match `BETTER_AUTH_URL` + `/api/auth/callback/apple` exactly. Apple
> does **not** accept `http://localhost` return URLs, so there is no local round-trip — test on the
> deployed environment.

## Step 1 — App ID

1. **Identifiers → +** → **App IDs → App**.
2. Give it a description and a Bundle ID (reverse-DNS, e.g. `com.themusicrepository.app`).
3. Under **Capabilities**, tick **Sign in with Apple**. Register.

## Step 2 — Services ID (this is the OAuth `client_id`)

1. **Identifiers → +** → **Services IDs**.
2. Description + an identifier (reverse-DNS, e.g. `com.themusicrepository.web`). **This identifier is
   `APPLE_CLIENT_ID`** — it is *not* the App ID from Step 1.
3. Register, then open it and tick **Sign in with Apple → Configure**:
   - **Primary App ID:** the App ID from Step 1.
   - **Domains and Subdomains:** the site domain (e.g. `themusicrepository.com`).
   - **Return URLs:** the prod Return URL from the table above.
4. Save.

## Step 3 — Domain verification

Apple requires proof you control the domain used above.

1. In the Services ID's Sign in with Apple config, **download** `apple-developer-domain-association.txt`.
2. Serve it at `https://<domain>/.well-known/apple-developer-domain-association.txt`.
   - In this app, `.well-known` files are middleware-rewrite-only routes that must be **injected** to be
     served in production (see the existing `.well-known` handling / `docs/features` notes on
     middleware-mode routing). A dev-only file drop won't survive the prod build.
3. Back in Apple, click **Verify**.

## Step 4 — Signing key (the client-secret key)

1. **Keys → +** → name it, tick **Sign in with Apple**, set the primary App ID, register.
2. **Download the `.p8` once** (Apple never shows it again). Note the **Key ID** shown next to it.
3. Note your **Team ID** (top-right of the developer portal / Membership page).

## Step 5 — Set the credentials

**Local** (`.env`) — Apple can't call back to localhost, so this only lets the button render/start:
```
APPLE_CLIENT_ID=com.themusicrepository.web      # the Services ID
APPLE_TEAM_ID=<10-char Team ID>
APPLE_KEY_ID=<Key ID of the .p8>
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
Store `APPLE_PRIVATE_KEY` as the PEM with literal `\n` in place of newlines (the API normalizes them).

**Render:** add the same four keys to the **`dev` env group** (Dashboard → Env Groups → dev), not inline
in `render.yaml`. Render supports multi-line values, so you can paste the raw PEM there instead of escaping.

## Step 6 — Flag

- `auth.apple` **defaults off** (`packages/flags`), so it seeds disabled. Enable it per-environment in
  `/admin/feature-flags` once the credentials are set for that environment.
- **Flag on without credentials = a button that errors on click.** Enable it only where the four env vars
  are set.

## Step 7 — Test

- **Local:** with the env vars set + the flag on, `/signin` shows "Continue with Apple" and clicking it
  starts the redirect to `appleid.apple.com`. Apple won't complete the callback to localhost — that's
  expected.
- **Deployed (real round-trip):** on the HTTPS environment, sign in with an Apple ID; it returns via
  `POST .../api/auth/callback/apple` and creates/links the account by verified email. First authorization
  captures the name; the email may be a `@privaterelay.appleid.com` address.

## Gotchas — lessons learned

- **Services ID ≠ App ID.** The OAuth `client_id` (`APPLE_CLIENT_ID`) is the **Services ID**, not the App
  ID. Using the App ID yields `invalid_client`.
- **No `localhost` return URLs.** Apple only accepts HTTPS return URLs on verified domains, so the full
  flow can't be exercised locally — verify on the deployed environment.
- **The client secret is a JWT that expires.** The API generates and auto-refreshes it from the `.p8`, so
  there's nothing to rotate manually — but if you ever paste a static secret elsewhere, it silently dies
  within six months. Keep the `.p8` + Team ID + Key ID in env, not a pre-baked JWT.
- **Download the `.p8` immediately.** Apple shows the private key exactly once; if lost, revoke the key and
  make a new one.
- **Domain-association file must be served in prod.** A `.well-known` file that only exists in dev/static
  won't be served by the production middleware-mode server unless its route is injected.
- **Private-relay email + transactional mail.** If the app ever emails a user at a
  `@privaterelay.appleid.com` address, register the sender under Sign in with Apple → **Email Sources** or
  it bounces. (Apple accounts arrive `emailVerified`, so no verification email is sent on sign-up.)
