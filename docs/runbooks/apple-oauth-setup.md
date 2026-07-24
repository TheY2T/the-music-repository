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

> **⚠️ The domain to register + verify is the API domain (`api.themusicrepository.com`), NOT the web
> domain.** Better Auth builds the OAuth `redirect_uri` from `BETTER_AUTH_URL`, which is the **API**
> (`https://api.themusicrepository.com/api/auth/callback/apple`). Apple requires the redirect_uri's domain
> to be a registered + verified domain on the Services ID, so `api.themusicrepository.com` is what goes in
> **Domains and Subdomains**, and Apple fetches the verification file from
> `https://api.themusicrepository.com/.well-known/...`. Registering the bare web domain instead is what
> causes **"Invalid client id or web redirect url"** at sign-in. Confirm the exact values Better Auth sends
> with: `curl -sX POST https://api.themusicrepository.com/api/auth/sign-in/social -H 'Content-Type:
> application/json' -d '{"provider":"apple","callbackURL":"https://themusicrepository.com/"}'` → read
> `client_id` + `redirect_uri` from the returned `url`.

## Step 1 — App ID (the *primary* App ID — do this first)

1. **Identifiers → +** → **App IDs → App**.
2. Give it a description and a Bundle ID (reverse-DNS, e.g. `com.themusicrepository.app`).
3. Under **Capabilities**, tick **Sign in with Apple** (leave it "Enable as primary App ID"). Register.

> This is a prerequisite for Step 2: a Services ID only offers the **Sign in with Apple** option once a
> primary App ID has the capability enabled.

## Step 2 — Services ID (this is the OAuth `client_id`)

1. **Identifiers → +** → **Services IDs**.
2. Description + an identifier (reverse-DNS, e.g. `com.themusicrepository.web`). **This identifier is
   `APPLE_CLIENT_ID`** — it is *not* the App ID from Step 1.
3. Register, then open it and tick **Sign in with Apple → Configure**:
   - **Primary App ID:** the App ID from Step 1.
   - **Domains and Subdomains:** **`api.themusicrepository.com`** — the API domain (the host of
     `BETTER_AUTH_URL`), because that's the host in the OAuth redirect_uri. **Not** the bare web domain.
   - **Return URLs:** `https://api.themusicrepository.com/api/auth/callback/apple` (exact).
4. Save.

> **If the "Sign in with Apple" checkbox / Configure button doesn't appear on the Services ID:** first
> confirm Step 1's App ID has the capability; then **register the Services ID and re-open it** (Configure
> only shows on the saved record). If it's *still* missing, **sign out of the Apple Developer portal and
> back in** — the portal caches the capability list per session and won't show it until you re-auth. (This
> bit us; the log-out/in was the fix.)

## Step 3 — Domain verification (served by the API, not the web app)

Apple verifies the domain from Step 2 by fetching the association file from **that** domain — the API.

1. In the Services ID's Sign in with Apple config, add `api.themusicrepository.com`, then **download** the
   `apple-developer-domain-association.txt` Apple generates for it (the file's embedded payload names the
   exact domain, so the API-domain file differs from any web-domain one).
2. Serve it from the **API** at `https://api.themusicrepository.com/.well-known/apple-developer-domain-association.txt`.
   The API (`apps/api`) serves this via `WellKnownModule` from the **`APPLE_DOMAIN_ASSOCIATION_TXT`** env var —
   paste the downloaded file's contents into that var on the `tmr-api-dev` service (multi-line is fine),
   and it serves immediately (no code change). The API is ungated by Cloudflare Access, so no bypass is
   needed there. (The web app's `.well-known` route is only for the Microsoft/Entra apex verification — a
   different mechanism — so Apple does **not** go through it.)
3. Verify it serves: `curl -sI https://api.themusicrepository.com/.well-known/apple-developer-domain-association.txt`
   → `200 text/plain`. Then click **Verify** in Apple.

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
Add `APPLE_DOMAIN_ASSOCIATION_TXT` too (from Step 3) if verifying locally isn't needed you can skip it locally.

**Render:** set all five keys on the **`tmr-api-dev`** service (Dashboard → the service → Environment, or
the `dev` env group). Render supports multi-line values, so paste the raw `.p8` PEM and the raw
`APPLE_DOMAIN_ASSOCIATION_TXT` file contents directly (no escaping needed). The five:
`APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_DOMAIN_ASSOCIATION_TXT`.

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

- **`INVALID_ORIGIN` on the callback = Apple's origin isn't trusted.** Apple returns via
  `response_mode=form_post`, so the browser POSTs `.../api/auth/callback/apple` with
  `Origin: https://appleid.apple.com`. Better Auth's CSRF origin check rejects it unless that origin is in
  `trustedOrigins`. `better-auth.ts` pushes `https://appleid.apple.com` onto `trustedOrigins` when Apple is
  configured — no env change needed. (This is separate from `TRUSTED_ORIGINS`/CORS, which governs the web
  app's credentialed XHRs, not Apple's top-level form POST.)
- **"Invalid client" (no "…redirect url") = the Services ID isn't fully set up for Sign in with Apple** —
  usually the primary App ID lacks the capability, the Configure step wasn't saved, or the domain isn't
  verified yet. If the **Sign in with Apple** option is missing on the Services ID entirely: enable it on a
  primary App ID first, then register + re-open the Services ID, and if still missing **sign out of the
  portal and back in** (session cache).
- **"Invalid client id or web redirect url" = the redirect_uri's domain isn't verified.** The callback is
  on the **API** domain (`api.themusicrepository.com`, from `BETTER_AUTH_URL`), so that subdomain — not the
  web/apex domain — must be the registered + verified **Domains and Subdomains** entry, with the exact
  Return URL `https://api.themusicrepository.com/api/auth/callback/apple`. The verification file is served
  by the API (`WellKnownModule` + `APPLE_DOMAIN_ASSOCIATION_TXT`), because Apple fetches it from the same
  domain. This bit us on the first setup: the file was on the web app and the apex domain was registered.
- **Services ID ≠ App ID.** The OAuth `client_id` (`APPLE_CLIENT_ID`) is the **Services ID**, not the App
  ID. Using the App ID yields `invalid_client`.
- **No `localhost` return URLs.** Apple only accepts HTTPS return URLs on verified domains, so the full
  flow can't be exercised locally — verify on the deployed environment.
- **The client secret is a JWT that expires.** The API generates and auto-refreshes it from the `.p8`, so
  there's nothing to rotate manually — but if you ever paste a static secret elsewhere, it silently dies
  within six months. Keep the `.p8` + Team ID + Key ID in env, not a pre-baked JWT.
- **Download the `.p8` immediately.** Apple shows the private key exactly once; if lost, revoke the key and
  make a new one.
- **The association file is served by the API, from an env var.** `apps/api` `WellKnownModule` returns
  `APPLE_DOMAIN_ASSOCIATION_TXT` at `/.well-known/apple-developer-domain-association.txt`; if the var is unset
  the path 404s (so Apple verification fails). It's domain-specific — the file Apple issues for
  `api.themusicrepository.com` won't verify any other domain.
- **Private-relay email + transactional mail.** If the app ever emails a user at a
  `@privaterelay.appleid.com` address, register the sender under Sign in with Apple → **Email Sources** or
  it bounces. (Apple accounts arrive `emailVerified`, so no verification email is sent on sign-up.)
