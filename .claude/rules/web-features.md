---
paths:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.astro"
---

# apps/web — feature gotchas & pointers

`apps/web` is a **shell** (ADR 0033): routes, middleware/`Astro.locals`, flag-gating, `BaseLayout` +
`global.css`, prop-passing. Complex UI lives in the packages (`musickit-ui`/`common-ui`/`music-core`/
`web-data`/`ui`). Pages read `Astro.locals`, gate flags, mount a package island, and pass
`locale`/`flags`/`user` down as **props**. `Astro.locals` never leaves `apps/web`.

Each feature has a full doc under `docs/features/` — read it before changing that feature. Below are only
the **non-obvious gotchas** that bite in the shell.

## Auth SSR origin (the redirect-loop trap)

The middleware's session check runs **server-side**, so it forwards the request cookie to the API using
`API_INTERNAL_URL` (→ `http://api:3000` in compose) and only falls back to the browser's
`PUBLIC_API_BASE_URL` for host dev. **Inside the web container `localhost:3000` is the web container
itself** — without `API_INTERNAL_URL` every gated page bounces to `/signin` even after a valid sign-in.
Gate a page with `if (!Astro.locals.user) return Astro.redirect('/signin?redirect=…')`; the gate is
UX-only (the API re-authorizes mutations). Client auth: `src/lib/auth-client.ts`, `credentials:'include'`.

## Monetization is DEFERRED — two independent flags

- **`monetization.premium`** — the entitlement engine (locking, checkout, grants). OFF ⇒ API locks nothing.
- **`monetization.messaging`** (`monetizationMessaging` in locals) — any user-facing *mention* of premium
  (badges, upgrade CTAs, Premium nav link). OFF ⇒ the app never references paid content.
- Pages pass a **`showMonetization`** prop (= `flags.monetizationMessaging`); a 🔒 badge renders only when
  `item.locked && showMonetization`. **No client-side entitlement logic** — the API's `item.locked` decides.
  See `docs/features/monetization.md`.

## Feature-flag SSR pattern

`src/middleware.ts` evaluates flags per request into `Astro.locals.flags`; **pass values into islands as
props** so first paint matches the server (never read flags inside an island). Follow **`manage-flags`**.

## Feature docs (read before editing)

Admin CMS → `admin-cms.md` · Favorites → `favorites.md` · Collections → `collections.md` · Progress →
`progress.md` · Info View → `info-view.md` · Classrooms → `classrooms.md` · Drills → `drill-engine.md` ·
Interactive tools/scores → see `.claude/rules/interactive-tools.md` + `scores.md`.
