# ADR 0054 — Sign in with Apple

- **Status:** Accepted
- **Date:** 2026-07
- **Context:** Sign-in offers email/password plus OAuth social providers (Google/Facebook, ADR 0050;
  Microsoft, ADR 0052) and WhatsApp phone-OTP (ADR 0053). ADR 0050 deferred Apple because Sign in with
  Apple needs a paid Apple Developer Program membership, domain verification, and a client secret that is a
  signed, expiring JWT rather than a static string. With a membership now available, we add Apple as
  another flag-gated one-click social provider. Apple *is* an OAuth provider, so it fits the existing
  redirect-button pattern — the only novelty is how its client secret is produced and that it discloses
  the user's name only once.
- **Decision:**
  - **One-click social button, like Google/Facebook.** Apple joins the built-in `socialProviders` in
    `better-auth.ts` and the config-driven `PROVIDERS` list in `SocialSignInButtons`
    (`@TheY2T/tmr-common-ui`), started via `authClient.signIn.social({ provider: 'apple' })`. An Apple
    brand mark joins the `SocialProvider` set in `@TheY2T/tmr-ui`, drawn with `currentColor` so it tracks
    the foreground token across the light/dark themes (Apple's mark is monochrome). No browser client
    plugin is needed — `signIn.social` is built in.
  - **Client secret is a self-refreshing ES256 JWT.** Apple's OAuth `client_secret` is a short-lived JWT
    signed with the account's Sign in with Apple key. `apps/api/src/auth/create-apple-client-secret.ts`
    signs it with `node:crypto` (ECDSA P-256 / SHA-256, IEEE-P1363 signature encoding) — no JWT
    dependency — and exposes a value that regenerates before expiry. Because Better Auth reads
    `clientSecret` at each token exchange, `better-auth.ts` registers `socialProviders.apple` with a
    `get clientSecret()` accessor delegating to that value, so the secret rotates over the whole process
    lifetime with no manual step. This mirrors the module-scoped `create-mail-transport` /
    `create-whatsapp-sender` factory idiom (Better Auth runs outside Nest DI and reads `process.env`).
  - **Profile handling is the provider default.** Apple returns the user's name only on the first
    authorization and the email is often a private-relay address; Better Auth's Apple provider already
    captures the first-authorization name and accepts the relay email, so no `mapProfileToUser` is added.
    Apple is deliberately **left off** `account.accountLinking.trustedProviders` — relay emails make
    trusted linking an account-takeover risk — so it links only via the verified-email path.
  - **Flag-gated UI, env-gated provider.** A new `auth.apple` flag (default **off**, since it needs Apple
    credentials) gates the button on the sign-in and sign-up forms via a `showApple` prop. The provider
    registers only when all four of `APPLE_CLIENT_ID` (the Services ID), `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
    and `APPLE_PRIVATE_KEY` (the `.p8` PEM) are present, so the app boots with none set.
- **Consequences:**
  - Four env vars join the config schema: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
    `APPLE_PRIVATE_KEY`. The private key is the `.p8` PEM, stored `\n`-escaped for single-line env storage
    and normalized in code. Setup (App ID, Services ID, signing key, domain verification) is in the setup
    runbook.
  - **No local round-trip.** Apple rejects `localhost` return URLs, so the full callback is verified on the
    deployed HTTPS environment; local dev only confirms the button renders and starts the redirect. Because
    `auth.apple` defaults off, the button is also absent in the hermetic E2E run.
  - No new npm dependency — the JWT is signed with `node:crypto`, keeping the API dependency-light and the
    secret generation synchronous (which is what lets the `clientSecret` accessor stay a plain getter).
  - Emailing a private-relay address later (transactional mail) would require registering the sender under
    Apple's Email Sources; Apple accounts arrive email-verified, so sign-up sends no verification email.
- **Supersedes:** none. Resolves the Apple deferral recorded in ADR 0050 and extends it and ADR 0052
  (Microsoft) / ADR 0053 (WhatsApp); relies on ADR 0012 (port/factory naming), ADR 0013 (Better Auth),
  ADR 0035 (DB-backed flags), and ADR 0049 (Render/Cloudflare hosting).
