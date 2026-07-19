# ADR 0038 — Legal pages + business identity (ABN)

- **Status:** accepted
- **Date:** 2026-07

## Context

The site collects personal information (accounts via the authentication service, learner progress,
drill attempts, review scheduling, saved progressions, preferences) but had no business identity or
legal surface: no privacy policy, terms, cookie notice, or About page; no display of the operator's
Australian Business Number; and no organisation structured data.

The operator trades as an Australian sole trader — **Michael Hewett, ABN 31 769 705 046**. Two
needs drive this decision:

1. **Business credentials.** Displaying the trading name + ABN (footer, About page, and schema.org
   structured data) is standard practice for an Australian business and supports verification.
2. **Privacy compliance.** Under the Australian Privacy Principles (APP 1), a site handling personal
   information should publish a plain-English privacy policy covering what it collects, why, how to
   access/correct it, how to complain, and overseas disclosure. The small-business turnover
   exemption is being wound back (targeted removal), so publishing now is prudent.

## Decision

1. **Four hand-authored Astro pages** under `apps/web/src/pages/` — `/privacy`, `/terms`,
   `/cookies`, `/about` — each a thin `BaseLayout` + `PageShell` shell with prose in markup, styled
   with semantic token utilities. Legal prose is **not** stored as i18n string keys (those are for
   short UI strings); only chrome (titles, link labels) is localized via `t()`. Prose is
   English-only for now; Chinese is deferred.
2. **Single source of truth** for business facts in `apps/web/src/lib/business.ts` (trading name,
   ABN, contact email, effective date, governing-law state), consumed by the footer, the About page,
   and the Organization JSON-LD — no duplication.
3. **Footer** (`packages/common-ui/src/astro/SiteFooter.astro`) gains a **Legal** link column and a
   bottom-bar trading-name + ABN line, driven by props passed from `apps/web` (the package stays
   presentational). Legal destinations are registered in `buildLegalNav` in
   `packages/web-acl/src/nav.ts`.
4. **schema.org Organization** `application/ld+json` is injected into `BaseLayout`'s `<head>` with
   the legal name, ABN identifier, URL, and contact point.
5. **Not flag-gated.** Unlike other features, legal pages and the business-identity footer are always
   on — a privacy policy and terms must be reachable from every page and must never be toggled off.
   This is a deliberate, documented exception to the "ship behind a flag" rule.

## Consequences

- The site presents a compliant, always-available legal surface and displays the operator's ABN
  across the footer, About page, and structured data.
- Updating the trading name, ABN, contact, or effective date is a one-line change in
  `business.ts`; the footer, About page, and JSON-LD update together.
- The page copy is drafted to reflect actual data practices and the APPs but is **not legal advice**;
  professional review is recommended before relying on it.
- Chinese translation of the legal prose remains outstanding; a future change can add it (and, if
  editor-editable legal text is ever needed, a CMS-backed page content type).
