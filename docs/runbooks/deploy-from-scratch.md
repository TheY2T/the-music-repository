# Runbook: Deploy the private dev environment from scratch

A step-by-step, replayable record of standing up **The Music Repository** dev environment on
**Render + Cloudflare + Resend**. Follow top to bottom to rebuild from nothing. Architecture rationale
lives in [`docs/features/deployment.md`](../features/deployment.md) and
[ADR 0049](../adr/0049-hosting-render-cloudflare-resend.md); this is the *procedure*.

> **Read the [Gotchas](#gotchas--lessons-learned) section first.** Every one of them cost us time on the
> first run; doing the steps in the order below avoids them.

## What you get

- **web** (Astro SSR), **api** (NestJS), **Postgres** — all on Render (stack is web + API + Postgres
  only; search + media are Postgres-backed per ADR 0048, so there's no Meilisearch/MinIO to run).
- **Cloudflare** DNS + a **Cloudflare Access** gate so the site is private (invite-only) while in dev.
- **Resend** for transactional email (the contact form + Better Auth account emails).
- Cost ≈ **$20/mo USD** (2× `starter` web + 1× `basic-256mb` Postgres). ~$32 AUD.

## Prerequisites

- The repo pushed to GitHub (`TheY2T/the-music-repository`), `main` branch.
- A **Render** account with a **payment method on file** (required — see gotchas) and the **Render CLI**
  (`brew install render`, then `render login`, then `render workspace set`).
- A **Cloudflare** account with `themusicrepository.com` added as an **active zone** (nameservers on
  Cloudflare).
- A **Resend** account.
- These repo pieces already exist (don't skip verifying them — the first run broke without them):
  - `render.yaml` at the repo root.
  - Generated API client committed: `packages/api-client/src/generated/**` is **force-tracked** (the
    root `.gitignore` `generated/` rule is negated for it). If it's missing, the web build fails on
    Render with `Module not found: ./generated/authoring/authoring`.
  - `apps/api` has a `db:deploy` script (`db:migrate && db:seed:auth && (db:seed || true)`) — the
    Render `preDeployCommand` calls it.
  - `apps/web/Dockerfile` declares `ARG PUBLIC_SITE_URL` / `ARG PUBLIC_API_BASE_URL` (baked into the
    client bundle at build).
  - Both apps reject `*.onrender.com` Host (web middleware + api `main.ts`), so Render's public URLs 404.

---

## 1. Render — services + Postgres (Blueprint)

1. **Create the `dev` environment group** in Render (Env Groups → New). Leave it empty for now;
   `render.yaml` references it via `fromGroup: dev`.
2. Validate the Blueprint locally: `render blueprints validate` (run `render workspace set` first).
3. Render dashboard → **New → Blueprint → select `TheY2T/the-music-repository` → Apply**. It creates:
   - `tmr-db-dev` — managed Postgres 16 (`basic-256mb`, region `oregon`)
   - `tmr-api-dev` — Docker web service (`apps/api/Dockerfile`, port 3000, health `/health`)
   - `tmr-web-dev` — Docker web service (`apps/web/Dockerfile`, port 4321)
4. First deploy builds both images and runs the API `preDeployCommand` (migrations + seed). Wait for
   both to go **Live**. Each service gets a `*.onrender.com` URL.

`render.yaml` sets most env inline. The `dev` group only needs the **Resend** vars, added in step 4.
Web↔API server calls use Render's private network: `API_INTERNAL_URL=http://tmr-api-dev:3000`.

---

## 2. Cloudflare — DNS + custom domains

1. In the Cloudflare zone, create three **DNS-only (grey-cloud)** records first:
   | Type | Name | Target |
   |---|---|---|
   | CNAME | `themusicrepository.com` | `tmr-web-dev.onrender.com` |
   | CNAME | `www` | `tmr-web-dev.onrender.com` |
   | CNAME | `api` | `tmr-api-dev.onrender.com` |
2. In Render, add **Custom Domains** (each service → Settings → Custom Domains):
   - `tmr-web-dev` → `themusicrepository.com` **and** `www.themusicrepository.com`
   - `tmr-api-dev` → `api.themusicrepository.com`
   Render verifies via the grey-cloud DNS and issues TLS (Google Trust Services). **www needs its own
   DNS record or Render can't verify it** (its error names `www.…`).
3. Once all custom domains are **verified**, flip the three records to **Proxied (orange)** and set
   **SSL/TLS → Overview → Full (strict)** in the Cloudflare dashboard.

---

## 3. Cloudflare Access — the privacy gate

1. **Enable Zero Trust** (one-time): Cloudflare dashboard → **Zero Trust** → pick a **team name** →
   choose the **Free** plan. (This is a dashboard step; it can't be done via API.)
2. **Enable the One-time PIN login method**: Zero Trust → **Integrations → Identity providers → Add new
   identity provider → One-time PIN**. New orgs default to the **Cloudflare** IdP only, which is
   **members-only** and blocks external invitees — OTP is *not* added automatically anymore.
3. Create a **self-hosted Access application** over **`themusicrepository.com` + `www.themusicrepository.com`
   ONLY**. **Do NOT include `api.themusicrepository.com`** — gating the API breaks browser CORS (see
   gotchas). Access → Applications → Add → Self-hosted.
4. Add an **Allow policy** whose **Include → Emails** lists everyone who may view the site (start with
   the owner). To add people later, **add their email to this policy** — do **not** add them as Cloudflare
   account *members*. Reusable policies must be **attached to the application** to take effect.
5. Invitees sign in with the **One-time PIN** option (email code); they must **not** use "Login with
   Cloudflare" unless they're a member of your account.

The API (`api.themusicrepository.com`) stays reachable through Cloudflare (proxied, not Access-gated) —
it only serves public-domain content, and its `*.onrender.com` URL is 404-blocked. Privileged endpoints
still require a Better Auth login.

---

## 4. Resend — email + contact form

1. Resend → **Domains → Add Domain** `themusicrepository.com`. Let it **autoconfigure Cloudflare DNS**
   (adds `send` MX + SPF TXT, `resend._domainkey` DKIM; DNS-only — email records aren't proxied). **Verify**.
2. Resend → **API Keys** → create a **Full-access** key.
3. In the Render **`dev` env group**, set (the key must be **inlined**, Render does not interpolate
   variables — see gotchas):
   - `SMTP_URL` = `smtps://resend:re_YOUR_REAL_KEY@smtp.resend.com:465` (no `<>`, no `${}`, no quotes)
   - `MAIL_FROM` = `The Music Repository <admin@themusicrepository.com>`
4. **Redeploy the API** so it picks up the new env (env-group edits don't always auto-redeploy):
   `render deploys create <api-service-id> --confirm`, or save any service field to trigger one.

The mail path is nodemailer over SMTP (`SmtpMailSender`); Resend offers SMTP, so no code change is
needed. Contact form: `POST /contact` → `MailSender` → `CONTACT_RECIPIENT` (default
`admin@themusicrepository.com`), sender = `MAIL_FROM`, reply-to = the submitter.

5. **(Optional) Anti-bot on the contact form — Cloudflare Turnstile.** Cloudflare → Turnstile → add a
   widget for `themusicrepository.com`. In the `dev` env group set `TURNSTILE_SECRET_KEY` (secret) and
   `PUBLIC_TURNSTILE_SITE_KEY` (public — baked into the web build via the group + Dockerfile ARG).
   Unset ⇒ the challenge is skipped, so this can be added anytime. The server verifies the token
   (`CaptchaVerifier` → siteverify) and 400s on failure.

---

## 5. Verify

```bash
# API health (force-resolve avoids stale local DNS cache; use a Cloudflare proxy IP for the domain)
curl -s --resolve api.themusicrepository.com:443:<cf-ip> https://api.themusicrepository.com/health
# → {"status":"ok",...,"checks":{"database":"up"}}

# Catalogue search served from Postgres
curl -s --resolve api.themusicrepository.com:443:<cf-ip> "https://api.themusicrepository.com/catalogue/items?pageSize=1"
# → {"total":94,...}

# Site is gated
curl -s -o /dev/null -w "%{http_code}\n" --resolve themusicrepository.com:443:<cf-ip> https://themusicrepository.com/
# → 302 (redirect to <team>.cloudflareaccess.com)

# Render's public URLs are blocked
curl -s -o /dev/null -w "%{http_code}\n" https://tmr-web-dev.onrender.com/     # → 404
curl -s https://tmr-api-dev.onrender.com/health                                # → 200 (health is exempt)

# Contact form (public POST) — sends a real email via Resend
curl -s --resolve api.themusicrepository.com:443:<cf-ip> -X POST https://api.themusicrepository.com/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"you@example.com","subject":"test","message":"hi"}'
# → {"ok":true}  (500 with "535 Authentication credentials invalid" = bad SMTP_URL)
```
In a browser: visit `https://themusicrepository.com` → Access PIN login → catalogue browse/search works,
scores render, `/contact` submits and the email arrives.

---

## Gotchas & lessons learned

Ordered by where they bit us:

1. **Render requires a payment method.** `render blueprints validate` fails with `need_payment_info`
   until a card is on file — there's no indefinitely-free managed Postgres.
2. **Generated API-client code must be committed.** The root `.gitignore` had a blanket `generated/`;
   the web build (raw-source ESM) imports `@TheY2T/tmr-api-client` and failed on Render with
   `Module not found: ./generated/authoring/authoring`. Fix: force-add `packages/api-client/src/generated`
   and negate it in `.gitignore`. (Contracts' generated code was already tracked.)
3. **`preDeployCommand` doesn't run through a shell.** A `cmd && cmd && cmd` string got passed as
   *arguments* to the first command (`Unrecognized options for command 'migrate': &&, pnpm, …`). Fix:
   put the chain in a single npm script (`db:deploy`) and call that.
4. **Custom-domain `www` needs its own DNS record**, or Render can't verify it (`We weren't able to
   verify www.…`).
5. **Grey-cloud first, then proxy.** Render issues TLS while the record is DNS-only; flip to proxied
   (orange) only after it verifies. Cloudflare **Access requires proxied** records.
6. **Local DNS cache lies.** `api.` showed `HTTP 000` / "couldn't resolve" locally while public
   resolvers (1.1.1.1) had it fine. Verify with `dig @1.1.1.1` and `curl --resolve`.
7. **Don't put an Access gate in front of the API.** A browser calling `api.` cross-origin triggers a
   CORS preflight (`OPTIONS`) that Access answers with **403 (no `Access-Control-Allow-Origin`)**, so
   catalogue/search/contact all fail. Gate the **web app only**; leave the API reachable-but-ungated.
   (Airtight alternative = route the API same-origin under `/api`, a bigger refactor — not worth it for
   public-domain content.)
8. **New Zero Trust orgs default to the Cloudflare IdP (members-only).** External invitees can't sign in
   until you **enable One-time PIN** (Integrations → Identity providers). OTP is no longer auto-added.
9. **To share the site, add emails to the Access *policy*, not Cloudflare account *members*.** And a
   *reusable* policy must be **attached to the application** to have any effect.
10. **Env-group changes don't auto-redeploy** the linked services — trigger a deploy after editing them.
11. **Render does not interpolate env vars into each other.** `SMTP_URL=smtps://resend:${KEY}@…` (or
    `<API_KEY>`) is sent **verbatim** as the password → `535 Authentication credentials invalid`. The
    real key must be **inlined** into `SMTP_URL`.
12. **The MCP/API token couldn't edit some Cloudflare resources** — zone SSL settings (`9109`) and
    in-place Access app edits (`10405`). Those were done in the dashboard.

---

## Reference — live resource identifiers (dev)

| Thing | Value |
|---|---|
| GitHub repo / branch | `TheY2T/the-music-repository` / `main` |
| Render region / plans | `oregon` · web `starter`, db `basic-256mb` |
| Render — API service | `tmr-api-dev` (`srv-d9fnmt8k1i2s73b6nnhg`) |
| Render — web service | `tmr-web-dev` (`srv-d9fnmiok1i2s73b6n1cg`) |
| Render — Postgres | `tmr-db-dev` (`dpg-d9fnmj0k1i2s73b6n1n0-a`) |
| Render — env group | `dev` |
| Cloudflare — account | `3e8ce8645fbc7d7e8890f05e462533b0` |
| Cloudflare — zone | `themusicrepository.com` (`d5b3cb2ab942280b1eda955f0b6b5d9a`) |
| Cloudflare — Access app | `The Music Repository (dev)` (`f038e96f-e433-4c01-bb0c-eb4f57751d24`), covers apex + www |
| Cloudflare — Access team | `themusicrepository.cloudflareaccess.com` |
| DNS records (proxied) | apex + `www` → `tmr-web-dev.onrender.com`; `api` → `tmr-api-dev.onrender.com` |

## Env var reference

**Set in `render.yaml` (inline, per service):** `PORT`, `NODE_ENV`, `APP_ENV=dev`, `DATABASE_URL`
(from DB), `BETTER_AUTH_SECRET` (generated), `BETTER_AUTH_URL=https://api.themusicrepository.com`,
`AUTH_COOKIE_DOMAIN=.themusicrepository.com`, `TRUSTED_ORIGINS`, `WEB_BASE_URL`, `MEDIA_PUBLIC_URL`,
`API_INTERNAL_URL=http://tmr-api-dev:3000`, plus the web build args `PUBLIC_API_BASE_URL` /
`PUBLIC_SITE_URL`.

**Set in the `dev` env group (secrets, by hand):** `SMTP_URL`, `MAIL_FROM` (and optionally
`CONTACT_RECIPIENT`, which defaults to `admin@themusicrepository.com`); for the contact-form challenge,
`TURNSTILE_SECRET_KEY` + `PUBLIC_TURNSTILE_SITE_KEY`.

## Deferred hardening follow-ups

- **Better Auth (API) abuse:** the auth endpoints (`api./api/auth/*`) are reachable by bots (the app's
  login *page* is behind Access, but the API host isn't). Harden server-side — enable Better Auth's
  built-in rate limiting in `apps/api/src/auth/better-auth.ts`, and consider `disableSignUp` if the beta
  is invite-only. (A form CAPTCHA doesn't help here — bots hit the API directly.)
- **Free-tier WAF:** the Cloudflare free plan's rate-limiting rule is limited (10s window, URI-Path field
  only). A URI-Path rule on `/contact` + Bot Fight Mode is a stopgap; Turnstile is the real contact-form
  defense.

## CDN caching (activate the origin headers)

The API and web origins set compression + `Cache-Control` headers in-repo (ADR 0051 ·
[`docs/features/caching.md`](../features/caching.md)), but Cloudflare will not cache JSON/media by default
— it needs **Cache Rules**. These are **already applied** on the dev zone (rules 1–3 below, in the
`http_request_cache_settings` phase, verified `MISS→HIT`). Re-apply them from here if rebuilding the zone.
A token with **Zone → Cache Rules → Edit** is required (steps 4–5 additionally need **Zone Settings →
Edit**, and Smart Tiered Cache a paid plan; Brotli is on by default).

1. **Cache public API GETs** — When incoming requests match
   `(http.host eq "api.themusicrepository.com") and (http.request.method eq "GET") and (starts_with(http.request.uri.path, "/catalogue") or starts_with(http.request.uri.path, "/collections") or starts_with(http.request.uri.path, "/i18n") or starts_with(http.request.uri.path, "/help-topics") or starts_with(http.request.uri.path, "/faq-entries") or starts_with(http.request.uri.path, "/feature-flags") or http.request.uri.path eq "/media")`
   → **Eligible for cache**, Edge TTL + Browser TTL **Respect origin**, **Serve stale while updating** on.
2. **Bypass authenticated requests** (place after rule 1 so it overrides) — match
   `(http.host eq "api.themusicrepository.com") and (http.cookie contains "better-auth")` → **Bypass cache**.
3. **Cache web static assets** (takes effect once the Access gate is removed) — match
   `(http.host eq "themusicrepository.com" or http.host eq "www.themusicrepository.com") and (starts_with(http.request.uri.path, "/_astro/") or starts_with(http.request.uri.path, "/font/") or starts_with(http.request.uri.path, "/soundfont/"))`
   → **Eligible for cache**, Respect origin.
4. **Smart Tiered Cache:** Caching → Tiered Cache → enable Smart Tiered Cache Topology (fewer origin fills
   across PoPs).
5. **Brotli:** Speed → Optimization → Content Optimization → ensure Brotli is on (edge→client).

Ready-to-run API payload (create the `http_request_cache_settings` phase entrypoint), zone
`d5b3cb2ab942280b1eda955f0b6b5d9a`:

```
PUT /zones/{zone}/rulesets/phases/http_request_cache_settings/entrypoint
{ "rules": [
  { "description": "Cache public API GET reads", "expression": "<rule 1 above>",
    "action": "set_cache_settings",
    "action_parameters": { "cache": true, "edge_ttl": {"mode":"respect_origin"},
      "browser_ttl": {"mode":"respect_origin"}, "serve_stale": {"disable_stale_while_updating": false} } },
  { "description": "Bypass authenticated API requests", "expression": "<rule 2 above>",
    "action": "set_cache_settings", "action_parameters": { "cache": false } },
  { "description": "Cache web static assets", "expression": "<rule 3 above>",
    "action": "set_cache_settings",
    "action_parameters": { "cache": true, "edge_ttl": {"mode":"respect_origin"},
      "browser_ttl": {"mode":"respect_origin"} } }
] }
```

**Verify:** `curl -I https://api.themusicrepository.com/i18n/version` twice → `cf-cache-status` goes
`MISS` → `HIT`; the same path with `-H 'Cookie: better-auth.session_token=x'` shows `BYPASS`. `curl -I`
the origin (bypassing Cloudflare) should show `Content-Encoding: br` and the expected `Cache-Control`.

## Going public at launch

- Set `APP_ENV=production` → drops the global `noindex` and restores the real `robots.txt` + sitemaps.
- Remove the Cloudflare Access gate (or scope it down).
- Add a DMARC DNS record for better deliverability.
- Consider bumping web services off `free`/`starter` if traffic warrants, and adding Meilisearch/R2 only
  if catalogue scale outgrows Postgres search/media (both are behind ports — adapter swaps).
