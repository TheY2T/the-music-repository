# Feature: FAQ

- **Status:** shipped
- **Flag key:** `content.faq` (from `@TheY2T/tmr-flags`; web field `flags.faq`) — gates the public `/faq`
  page, its footer link, and the `/admin/faq` authoring surface. Default on.

## Purpose

A reader-facing **frequently-asked-questions** page: question/answer entries grouped by category
(Getting started · Learning & practice · Interactive tools · Content & licensing), authored and
reordered in the admin CMS without a deploy.

## UX behaviour

- **Public** `/faq` — one accordion per category (`FaqAccordion` island). Each entry is a question
  (accordion trigger) over a Markdown answer. Entries are **SSR-fetched** in the page frontmatter so the
  question/answer text is in the crawler-visible HTML. Linked from the footer (legal nav) only.
- **Admin** `/admin/faq/*` (editor/admin, flag-gated) — the generic `EntityManager` (Hub grouped by
  category + Table, search) + a create/edit form (`slug`, `question`, `category`, `sort order`, Markdown
  `answer`) + delete. Per-locale translation of `question`/`answer` is integrated into the form via the
  `LocaleBar` (ADR 0034), like the other content editors.

## Data model

`faq_entries` (`slug` unique, `question`, `answer` markdown, `category`, `sort_order` int). Ordered by
`category` then `sort_order`. No draft/publish — entries are always live. Migration `drizzle/0028_*`.

## API contract

Paths from TypeSpec (tag `faq`); generated types in `@TheY2T/tmr-api-client`, DTO bodies in
`@TheY2T/tmr-contracts`. Every route is gated by the `content.faq` flag (method-level).

| Route | Auth | Notes |
|---|---|---|
| `GET /faq-entries` | public | all entries, ordered; `?locale=` overlays translations |
| `GET /faq-entries/{slug}` | public | one entry; 404 otherwise |
| `POST /admin/faq-entries` | `content:create` | 201 (409 on duplicate slug) |
| `PUT /admin/faq-entries/{slug}` | `content:update` | |
| `DELETE /admin/faq-entries/{slug}` | `content:delete` | admin only (204) |

Hexagonal: `FaqEntryRepository` port ← `DrizzleFaqEntryRepository` (`apps/api/src/faq/`). RBAC reuses the
`content` resource. Per-locale overlay via the `ContentTranslations` port (`entityType='faq'`, fields
`question`/`answer`).

## SEO

`/faq` sets `title`/`description` (`faq.title` / `seo.faq.description`) and emits a **breadcrumb**
JSON-LD (Home → FAQ). No `FAQPage` structured data — it is a retired schema in this repo
(`.claude/rules/seo.md`). The page is in `sitemap-static.xml` when the flag is on; it is not `noindex`.

## Seed

`FAQ_ENTRIES` in `seed-data.ts` (~19 entries across the four categories). `pnpm --filter @TheY2T/tmr-api
db:seed`. Editable in the CMS thereafter.

## Tests

- **API unit** — `faq-entry.use-cases.test.ts`: list overlay, not-found error, slug-conflict error.
- **API integration** — `drizzle-faq-entry.repository.integration.test.ts`: CRUD + category/sort ordering.
- **web-acl** — `nav.test.ts`: the footer FAQ link appears (localized) when the flag is on.
- **Component** — `FaqAccordion.test.tsx`: grouping by category, question/answer rendered, empty state.
- **E2E** — `e2e/faq.spec.ts`: `/faq` heading renders; footer exposes the FAQ link.
