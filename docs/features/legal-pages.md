# Feature: Legal & company pages

- **Phase:** — · **Status:** shipped
- **Flag key:** none — legal pages and the business-identity footer are always on (a privacy
  policy and terms must be reachable from every page). See ADR 0038.

## Purpose

Publish the site operator's Australian business identity (trading name + ABN) and the legal
pages a personal-information-collecting site should provide: a Privacy Policy (aligned with the
Australian Privacy Principles), Terms of Service, a Cookie notice, and an About/legal page that
carries the canonical business details and contact point.

## UX behaviour

- Four hand-authored routes under `apps/web/src/pages/`: `/privacy`, `/terms`, `/cookies`,
  `/about`. Each is a thin Astro shell (`BaseLayout` + `PageShell`) with the prose written
  directly in markup and styled with semantic token utilities (re-themes across all aesthetics ×
  light/dark).
- The global `SiteFooter` gains a **Legal** link column (About · Privacy · Terms · Cookies) and a
  bottom-bar line showing the trading name + ABN, on every page.
- The site's `<head>` includes a schema.org **Organization** `application/ld+json` block with the
  legal name, ABN (as a `PropertyValue` identifier), URL, and contact email.

## Data model

None — no database tables. Business facts live in `apps/web/src/lib/business.ts` (trading name,
ABN, contact email, effective date, governing-law state) as the single source of truth consumed by
the footer, the About page, and the JSON-LD.

## API contract

None — these are static shell pages.

## Localization

Chrome (page titles, nav/footer link labels, the `ABN` label) is localized via `t(locale, key)`
using keys in `@TheY2T/tmr-i18n-locales` (`nav.about/privacy/terms/cookies`, `footer.legal`,
`footer.abnLabel`). The long-form legal prose is English-only for now; Chinese translation is
deferred (legal translation warrants deliberate review). Prose is not stored as i18n string keys —
i18n keys are for short UI strings.

## Help topics

None.

## Tests

- **Unit** (`packages/web-acl/src/nav.test.ts`) — `buildLegalNav` returns the four destinations,
  localizes hrefs under the active locale, and marks the current route active.
- **E2E** (`apps/web/e2e/legal.spec.ts`) — each page returns < 400 and renders its heading; the
  footer shows the trading name + ABN and links to all four pages; the Organization JSON-LD is
  present with the ABN identifier.
- Run: `pnpm --filter @TheY2T/tmr-web-acl test` and `pnpm test:e2e` (mocked).

## Not legal advice

The page copy is written to reflect what the app actually does and to align with the APPs, but it
is not legal advice; have it reviewed before relying on it.
