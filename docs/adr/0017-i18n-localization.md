# ADR 0017 — Localization (i18n): URL-prefix routing + dependency-free runtime JSON catalogue

- **Status:** accepted
- **Date:** 2026-07
- **Context:** Phases 0–6 shipped with hardcoded English UI copy. We need the web UI to render in the
  visitor's language, starting with **English + Simplified Chinese (`zh-Hans`)**, extensible later.

## Decision

1. **Scope first pass = web UI strings only.** Backend problem+json/mail strings and multilingual DB
   content are deferred to later phases (they need locale plumbing / schema+CMS+search changes).
2. **URL-prefix routing.** English at `/`, Chinese at `/zh/…` (SEO-friendly, shareable, supports
   `hreflang`). A **single set of page files** serves every locale: `src/middleware.ts` resolves the
   locale and **rewrites** `/zh/…` → the canonical path (`next(canonicalPath)`), keeping the browser URL.
   Astro's built-in `i18n` config is intentionally **not** used (it expects per-locale page directories /
   content fallback and would fight the single-file rewrite); we only set `site` for absolute hreflang.
3. **Engine = dependency-free runtime JSON catalogue** with a typed `t(locale, key, params?)`, in two
   packages: `@TheY2T/tmr-i18n` (engine) + `@TheY2T/tmr-i18n-locales` (per-language JSON). Chosen over
   i18next (runtime + React context, prone to island hydration flicker in Astro) and Paraglide/inlang
   (compile-time; doesn't split cleanly into the requested two packages, adds a build-step dep). The
   repo already favours dependency-free solutions; the catalogues are small.
4. **`zh-Hans` as the locale id** (script subtag) to future-proof Traditional `zh-Hant`; the URL segment
   stays the short `/zh/`; `<html lang="zh-Hans">`.
5. **Locale flows into islands as a plain `locale` prop**, never React context (context can't cross
   Astro island boundaries — see ADR/CLAUDE island rule). The locale is deterministic from the URL, so
   the SSR string matches the hydrated string → no flash / no hydration mismatch.
6. **`en.json` is the source of truth for keys** (`type MessageKey = keyof typeof en`); non-default
   languages are `Partial` and fall back to English at runtime.
7. Gated behind the **`platform.i18n`** flag.

## Consequences

- A single new prop (`locale`) threads through pages → islands; no dictionary is serialised per island.
- Adding a language = drop a `<locale>.json`, register it in `@TheY2T/tmr-i18n`, rebuild.
- Music-theory tokens and API/DB data stay language-neutral by design.
- `hreflang` alternates + a persisted `locale` cookie give correct SEO/UX.
- Trade-off: the middleware rewrite (not Astro's native i18n) owns locale routing — documented in
  `docs/features/i18n.md` so future work doesn't reintroduce Astro's `i18n` block by mistake.

## Alternatives considered

- **Cookie-only (no URL prefix):** simpler routing but weaker SEO (no distinct indexable Chinese URLs)
  and no `hreflang`. Rejected.
- **i18next / react-i18next:** mature, but runtime + provider-per-island risks flicker/hydration
  mismatch in Astro. Rejected for the SSR + islands mix.
- **Paraglide JS (inlang), compile-time:** best bundle size, but its output doesn't map to the requested
  `@TheY2T/tmr-i18n` + `@TheY2T/tmr-i18n-locales` split and adds a compile step. Reconsider if bundle
  size of the catalogues ever matters.
