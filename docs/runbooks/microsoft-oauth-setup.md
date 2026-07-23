# Runbook: Set up Microsoft OAuth sign-in

A step-by-step, replayable record of standing up **Microsoft sign-in** for The Music Repository — both
the **personal-account** flow (live now) and the **work/school** flow (scaffolded, deferred). The design
rationale lives in [`docs/features/auth.md`](../features/auth.md) and
[ADR 0052](../adr/0052-microsoft-sign-in-personal-and-work-school.md); this is the *procedure* plus the
account-verification gotchas that cost real time on the first run.

> **Read the [Gotchas](#gotchas--lessons-learned) section first.** The blockers here are almost all on the
> Microsoft side (app registration, publisher verification, Partner Center account verification), not in
> the code — and each has a non-obvious cause.

## What you get

- A **"Continue with Microsoft"** button on `/signin` + `/signup` for personal accounts
  (@outlook/@hotmail/@live), behind flag `auth.microsoft` (**default on**).
- A **"Continue with a work or school account"** button for organizational accounts, behind flag
  `auth.microsoft-work` (**default off**, deferred until classroom features land).

Each provider registers only when its own credentials are set, so the button appears but only *works*
once the matching Azure app + env vars exist.

## Prerequisites

- Admin of the Entra tenant that will own the app registrations — for this project that's
  **`themusicrepository.onmicrosoft.com`** (a directory-only tenant; it needs no Azure subscription).
- Access to set env vars locally (`.env`) and in the Render **`dev`** env group.
- For the "verified publisher" badge and Partner Center: a **verified Microsoft partner account** (see
  the publisher-verification section) — optional; sign-in works without it.

## Target values (what Azure must match)

These come straight from `apps/api/src/auth/better-auth.ts` — the Azure app config must match them
exactly. `BETTER_AUTH_URL` is `http://localhost:3000` locally and `https://api.themusicrepository.com`
on Render.

| | Personal (`auth.microsoft`) | Work/school (`auth.microsoft-work`) |
|---|---|---|
| Better Auth provider | built-in `microsoft` | generic-oauth `microsoftEntraId` |
| Tenant | `consumers` | `organizations` (default) |
| Azure "supported account types" | Personal Microsoft accounts only | Accounts in any organizational directory |
| Redirect URI (local) | `http://localhost:3000/api/auth/callback/microsoft` | `http://localhost:3000/api/auth/oauth2/callback/microsoft-entra-id` |
| Redirect URI (prod) | `https://api.themusicrepository.com/api/auth/callback/microsoft` | `https://api.themusicrepository.com/api/auth/oauth2/callback/microsoft-entra-id` |
| Env vars | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | `MICROSOFT_WORK_CLIENT_ID`, `MICROSOFT_WORK_CLIENT_SECRET`, opt. `MICROSOFT_WORK_TENANT_ID` |

> The redirect URI must match the deployment's `BETTER_AUTH_URL` exactly (scheme + host + path). A single
> Azure app can list multiple redirect URIs, so one app can serve both local and prod.

## Step 1 — Register the personal-accounts app (do this first)

1. [Entra admin center](https://entra.microsoft.com) (or portal.azure.com → Microsoft Entra ID) →
   **App registrations → New registration**, signed in as the `themusicrepository` tenant admin.
2. **Name:** e.g. `The Music Repository — Personal`.
3. **Supported account types:** *Personal Microsoft accounts only*.
4. **Redirect URI:** platform **Web** → the personal redirect URI from the table (add both local + prod).
5. Register, then copy the **Application (client) ID**.
6. **Certificates & secrets → New client secret** → copy the secret **Value** (shown once).

## Step 2 — Register the work/school app (optional, for later)

Same as Step 1 with:
- **Name:** e.g. `The Music Repository — Work/School`.
- **Supported account types:** *Accounts in any organizational directory*.
- **Redirect URI:** the `.../oauth2/callback/microsoft-entra-id` one from the table.

## Step 3 — Set the credentials

**Local** (`.env`):
```
MICROSOFT_CLIENT_ID=<personal app client id>
MICROSOFT_CLIENT_SECRET=<personal app secret value>
# work/school, when ready:
# MICROSOFT_WORK_CLIENT_ID=
# MICROSOFT_WORK_CLIENT_SECRET=
# MICROSOFT_WORK_TENANT_ID=            # default 'organizations'; a GUID scopes to one org
```
**Render:** add the same keys to the **`dev` env group** (Dashboard → Env Groups → dev), not inline in
`render.yaml`.

## Step 4 — Flags

- `auth.microsoft` **defaults on** (`packages/flags`), and the seed derives each environment's enabled
  state from that default — so on the next `db:seed`/`db:deploy` the flag seeds **enabled** and the
  button appears. No admin toggle needed for a fresh deploy.
- `auth.microsoft-work` **defaults off**; enable it per-environment in `/admin/feature-flags` when you're
  ready.
- The seed is idempotent (`onConflictDoNothing`) — it won't flip a flag row that already exists. If a
  prior deploy already seeded `auth.microsoft` as off, toggle it once in `/admin/feature-flags`.
- **Flag on without credentials = a button that errors on click.** Enable a flag only where its env vars
  are set.

## Step 5 — Test

Load `/signin` (or `/signup`): the "Continue with Microsoft" button appears → sign in with a personal
Microsoft account. It round-trips through `.../api/auth/callback/microsoft` and links to an existing
account by verified email. Repeat with `auth.microsoft-work` + the work app for the "work or school
account" button (it uses the `.../oauth2/callback/microsoft-entra-id` path).

Because both flags default off in the **hermetic E2E** run (flags fall back to code defaults there for
`auth.microsoft-work`; `auth.microsoft` defaults on), verify real sign-in against a live Azure app rather
than in mocked E2E.

## Verified-publisher badge ("unverified" on the consent screen)

New app registrations show **"unverified"** on the consent screen. Sign-in still works — it's a trust
badge. To replace it with the verified-publisher badge, complete **publisher verification**:

1. Create a **Microsoft partner account with a Partner One ID** (formerly MPN ID) at
   [partner.microsoft.com](https://partner.microsoft.com) and get it **verified** (business + domain).
2. Associate the app's Entra tenant with that partner account (Partner Center → Account settings →
   Tenants).
3. App registration → **Branding & properties** → set + verify a **Publisher domain**.
4. Same page → **Publisher verification → Add MPN ID** → enter the Partner One ID → Verify.

**Shortcut for organizational users only:** a tenant admin can grant **admin consent** to the app once,
which suppresses the per-user consent prompt for that directory — no publisher verification needed. This
does not help personal (`consumers`) accounts.

## Partner Center identity/business verification gotchas

The partner account verification (needed for publisher verification) checks **company name, address, and
primary contact** against government/third-party records. See
[Microsoft's verification doc](https://learn.microsoft.com/en-us/partner-center/enroll/understand-the-verification-process).

- **Sole trader ⇒ the legal entity is the individual.** The company name is your registered name, not a
  trading name.
- **Identity verification matches your government ID.** The primary-contact / tenant-user name must equal
  the name on your ID **exactly**, including middle names — a "primary contact details did not match"
  failure is usually a name gap (e.g. missing middle name). Fix the name on the **Entra user** (M365
  admin center → Users) *and* the Partner Center primary contact.
- **Company name + address must match your business-registry record verbatim** — for an Australian ABN,
  match the [ABR record](https://abr.business.gov.au) (entity name, address) exactly.
- **Don't use a personal email** (gmail) or the `.onmicrosoft.com` default domain for the primary
  contact. Email-ownership + employment checks want a **monitored mailbox on a domain the business
  owns**; be ready to supply domain-ownership proof (whois / purchase invoice / registry record).
- **A brand-new ABN takes time to propagate.** The datasets Microsoft verifies against lag the ABR by
  days-to-weeks, so a just-registered ABN can fail verification even with everything typed correctly —
  wait and resubmit. Verification runs 3–5 business days; you can appeal up to 3 times.

## Gotchas — lessons learned

- **The app registration and Partner Center live in the `themusicrepository` tenant, not the Digizoo
  tenant.** An `az login` session pointed at Digizoo (subscriptions `ark-*`/`zoo-*`) can't see either.
  Neither is manageable through the Azure resource MCP anyway — they're portal-only (Partner Center) or
  Microsoft Graph (Entra user/app), not ARM resources.
- **Redirect URI mismatch** is the most common callback rejection — it must equal `BETTER_AUTH_URL` +
  path exactly, per environment.
- **Personal vs work/school are different callback paths** — `/callback/microsoft` (built-in social) vs
  `/oauth2/callback/microsoft-entra-id` (generic-oauth). Don't cross them.
- **Enabling a flag doesn't register the provider** — the provider only registers when its env
  credentials are present, so a flag-on-without-creds button fails on click.
