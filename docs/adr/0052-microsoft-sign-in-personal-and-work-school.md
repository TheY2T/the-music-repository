# ADR 0052 — Microsoft sign-in: personal and work/school as separate flows

- **Status:** Accepted
- **Date:** 2026-07
- **Context:** Social sign-in (ADR 0050) shipped Google and Facebook. Microsoft is the next provider, but
  personal Microsoft accounts and work/school (organizational) accounts serve different audiences and
  arrive on different timelines: personal sign-in is wanted now, while work/school sign-in is tied to the
  future classroom features. Better Auth models these as two different mechanisms — a built-in `microsoft`
  social provider (which accepts a `tenantId`) and the generic-OAuth `microsoftEntraId` provider — so they
  can be wired independently rather than forced through one `common`-tenant provider.
- **Decision:**
  - **Two independent flows, two flags.** Personal accounts use the built-in `microsoft` social provider
    with `tenantId: 'consumers'`, gated by `auth.microsoft`. Work/school accounts use the generic-OAuth
    `microsoftEntraId` provider (providerId `microsoft-entra-id`) with `tenantId` from
    `MICROSOFT_WORK_TENANT_ID` (default `organizations`), gated by `auth.microsoft-work`. Both flags
    default **off**; personal is the near-term one, work/school is deferred until classroom features land.
    Each provider registers only when its own credentials are set, so local dev and CI boot with none.
  - **Client calls differ by flow.** Personal goes through `authClient.signIn.social({ provider:
    'microsoft' })` (callback `.../api/auth/callback/microsoft`); work/school goes through
    `authClient.signIn.oauth2({ providerId: 'microsoft-entra-id' })` (callback
    `.../api/auth/oauth2/callback/microsoft-entra-id`). This adds the `genericOAuth` server plugin
    (`apps/api`) and the `genericOAuthClient` browser plugin (`@TheY2T/tmr-web-acl`).
  - **Per-provider gating.** `SocialSignInButtons` (`@TheY2T/tmr-common-ui`) owns a provider list where
    each entry carries its brand mark, label, gating flag, and how to start the flow; the sign-in/sign-up
    pages thread `showSocial` / `showMicrosoft` / `showMicrosoftWork` derived from the flags. Both
    Microsoft buttons reuse the single `microsoft` brand mark — the personal/work distinction is carried
    by the label, not the logo.
  - **Account linking.** Left unchanged: `trustedProviders` stays `['google']`; both Microsoft flows link
    to an existing account via the verified-email path (Entra userinfo returns `email_verified`), matching
    Facebook's conservative stance.
  - **Separate Azure app registrations.** Personal ("Personal Microsoft accounts only") and work/school
    ("Accounts in any organizational directory") are distinct Entra ID apps with distinct redirect URIs
    and secrets, so the two lifecycles never interfere.
- **Consequences:**
  - Five env vars join `.env.example` and Render's `dev` group: `MICROSOFT_CLIENT_ID`/`_SECRET` (personal)
    and `MICROSOFT_WORK_CLIENT_ID`/`_SECRET`/`_TENANT_ID` (work/school). Completing either OAuth round-trip
    needs the matching Azure app; neither works locally without one.
  - Because both flags default off, the Microsoft buttons don't appear in the hermetic E2E run; a flow is
    verified by enabling its flag against a real Azure app registration.
  - The generic-OAuth plugin is now part of the auth surface, available for future organizational IdPs
    beyond Microsoft.
- **Supersedes:** none. Extends ADR 0050 (social identity providers); relies on ADR 0035 (DB-backed
  flags) and ADR 0049 (Render/Cloudflare hosting + cross-subdomain cookie).
