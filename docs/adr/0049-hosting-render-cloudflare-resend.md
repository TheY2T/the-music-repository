# ADR 0049 — Hosting on Render + Cloudflare + Resend

- **Status:** Accepted
- **Context:** The app needs a hosted home. After simplifying the stack to **web + API + Postgres**
  (ADR 0048), the runtime has no bespoke search/object-storage services, so a managed platform is a clean
  fit. The site is not launching publicly yet — it first runs as a **private dev environment**.
- **Decision:**
  - **Render** hosts all three pieces via a **Blueprint** (`render.yaml`): the API and web app as Docker
    web services and a **managed Postgres**, deployed from the GitHub repo into the existing **`dev`
    environment group**. Migrations + seed run in the API service's **`preDeployCommand`** (mirroring the
    local compose `init`). Web↔API server-side calls use Render's **private network** (`API_INTERNAL_URL`),
    so they bypass the public edge gate.
  - **Cloudflare** provides DNS for `themusicrepository.com` (apex → web, `api.` → API) and gates the
    private dev environment with **Cloudflare Access** (Zero Trust) over both hostnames. The app also
    enforces defence-in-depth de-indexing: when `APP_ENV !== 'production'`, `BaseLayout` emits a global
    `noindex,nofollow` and `robots.txt` returns `Disallow: /`.
  - **Resend** sends transactional email through the existing `MailSender`/SMTP path — no new mail code,
    just `SMTP_URL=smtps://resend:<key>@smtp.resend.com:465` + a verified `MAIL_FROM`. A **contact form**
    (`POST /contact` → `MailSender`) emails `contact@themusicrepository.com` → the operator, using the
    sender's address as the reply-to; a honeypot drops bots silently.
  - **Cross-subdomain auth:** with web on the apex and API on `api.`, `AUTH_COOKIE_DOMAIN` shares the
    Better Auth session cookie across both (`SameSite=None; Secure`). Unset locally.
- **Consequences:**
  - Public build config (`PUBLIC_SITE_URL`, `PUBLIC_API_BASE_URL`) is baked at Docker build via matching
    `ARG`s — Render passes service env vars as build args. These must be set on the web service.
  - The browser reaches the API through Cloudflare, so Access covers both hostnames under one policy;
    server-side SSR calls go over the private network and are unaffected.
  - Local development is unchanged: `AUTH_COOKIE_DOMAIN`/`SMTP_URL`/`MEDIA_PUBLIC_URL` unset → host-only
    lax cookies, logged mail, localhost media.
- **Deferred to launch:** flip `APP_ENV=production` (drops the global noindex, restores the real
  `robots.txt`/sitemaps) and remove the Cloudflare Access gate.
