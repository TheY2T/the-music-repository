# ADR 0013 — Authentication & RBAC via Better Auth (admin plugin)

- **Status:** Accepted
- **Context:** Slice 2 adds the people layer (auth, permission-based RBAC, admin CMS, favorites). We
  need email/password login now (dev), Google/Microsoft later with zero rework, permission-based
  authorization (not just role checks), and — per the hexagonal rule — the domain must stay free of
  any auth framework.
- **Decision:**
  - **Library: Better Auth** (`better-auth`) mounted in the **API only** via
    `@thallesp/nestjs-better-auth`, with the **Drizzle adapter** over Postgres. It owns `/api/auth/*`.
    OIDC providers (Google/Microsoft) are additive config later — no schema or code rework.
  - **Tables** (`src/auth/auth-schema.ts`): `user` / `session` / `account` / `verification` plus the
    admin-plugin fields (`user.role`, `banned`, `ban_reason`, `ban_expires`, `session.impersonated_by`).
    IDs are `text` (Better Auth generates string ids). The tables are re-exported from
    `infrastructure/database/schema.ts` so **drizzle-kit** (not `better-auth migrate`) owns migrations.
  - **RBAC = permission-based** via the admin plugin's access-control (`src/auth/access-control.ts`):
    a statement `{ content:[create,read,update,delete,publish], media:[…], taxonomy:[…] }` and roles
    `admin` (all), `editor` (content/media/taxonomy incl. publish, no delete), `learner` (read).
  - **Enforcement at the edge:** the library's `AuthGuard` + our thin `@RequireAuth()` /
    `@RequirePermissions({ resource:[actions] })` wrappers (`src/auth/require-permissions.decorator.ts`).
    The **global auth guard is disabled** (`disableGlobalAuthGuard: true`) so the public catalogue stays
    anonymous; protected routes opt in explicitly.
  - **Domain stays pure:** use-cases read the acting user through the domain-capability port
    `CurrentUser` (`src/auth/application/current-user.ts`, ADR 0012 naming), implemented by the
    request-scoped `BetterAuthCurrentUser` adapter. The core never imports `better-auth`
    (enforced by the `eslint-plugin-boundaries` domain rule).
  - **Errors** flow through the platform: auth failures surface as RFC 9457 `problem+json` with a
    `traceId` (401 `UNAUTHENTICATED` / 403). See ADR 0007.
- **Bootstrapping:** `bodyParser: false` on `NestFactory.create` is **mandatory** — the @thallesp
  module re-adds body parsing for non-auth routes while preserving the raw body for `/api/auth/*`.
  CORS is configured once at the app level from `TRUSTED_ORIGINS` (exact origins + `credentials: true`);
  the module's own trusted-origins CORS is disabled to avoid double headers. No `setGlobalPrefix`
  (avoids `/api/api`).
- **Cross-origin cookies (dev):** web `:4321` and API `:3000` are **same-site** (cookies ignore port),
  so `SameSite=Lax` cookies are sent to both and the Astro SSR gate can forward them to
  `get-session`. Production collapses to one origin behind a reverse proxy. The SSR gate is **UX-only** —
  the API re-authorizes every mutation.
- **Seeding:** dev accounts (`admin`/`editor`/`learner`@local.dev, shared password) are created via
  `signUpEmail` (Better Auth hashes the password) then elevated by writing `user.role` directly — the
  bootstrap case, since no admin yet exists to authorize the admin-plugin `createUser`. **Local only.**
- **Consequences:** one library covers sessions, credentials, RBAC, and (later) OIDC. The domain is
  auth-agnostic behind `CurrentUser`. Adding OAuth or organizations is config, not rearchitecting.
- **Alternatives considered:** Passport (`google`/`azure-ad`) + custom JWT refresh — more moving parts,
  no built-in RBAC/admin surface; kept as a fallback only.
