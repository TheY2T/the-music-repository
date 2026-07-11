# Feature: Collections (learning structure)

- **Phase:** 2 (Slice A) · **Status:** shipped
- **Flag key:** `learning.collections` (from `@TheY2T/tmr-flags`) — gates the public browse pages + the
  admin collections CMS. Default on.

## Purpose

Ordered groupings of catalogue items — **courses**, **learning paths**, **syllabi**, and **song
lists** — the structural layer Phase 2 builds progress and guided learning on.

## UX behaviour

- `/collections` — grid of published collections (kind badge + item count).
- `/collections/{slug}` — the collection with its **numbered, ordered items**, each linking to the
  catalogue detail. Only published items are shown (renumbered).
- `/admin/collections` (editor/admin, flag-gated) — list + create/edit form: metadata (slug, title,
  summary, kind) + an **ordered content-slug list** (one per line) + publish / unpublish / delete.

## Data model

`collections` (slug, title, summary, kind, visibility, status) + `collection_items`
(`collection_id`, `content_id`, `position`; PK `(collection_id, content_id)`). Migration `drizzle/0004_*`.
Items reference `content_items`; unknown slugs are dropped on save. Cascade deletes both ways.

## API contract

Paths from TypeSpec (tag `collections`); generated hooks/types in `@TheY2T/tmr-api-client`.

| Route | Auth | Notes |
|---|---|---|
| `GET /collections` | public | published summaries |
| `GET /collections/{slug}` | public | published detail (published items only); 404 otherwise |
| `GET /admin/collections` | `content:update` | all statuses |
| `POST /admin/collections` | `content:create` | creates a draft (201) |
| `GET /admin/collections/{slug}` | `content:update` | any-status detail for editing |
| `PUT /admin/collections/{slug}` | `content:update` | metadata |
| `PUT /admin/collections/{slug}/items` | `content:update` | replace ordered items (unknown slugs dropped) |
| `POST /admin/collections/{slug}/publish` \| `/unpublish` | `content:publish` | |
| `DELETE /admin/collections/{slug}` | `content:delete` | admin only (204) |

Hexagonal: one `CollectionRepository` port (read + write) ← `DrizzleCollectionRepository`;
`CollectionDetailAssembler` resolves ordered slugs into `ContentSummary` via the catalogue
`ContentRepository`. RBAC reuses the `content` permission resource.

## Seed

3 published collections in `seed-data.ts` (`piano-fundamentals` course, `blues-starter-path` path,
`music-theory-basics` syllabus), wired to seeded content slugs. Run `pnpm --filter @TheY2T/tmr-api db:seed`.

## Tests

- **Backend (curl):** public list (3) + ordered detail; unknown → 404; learner admin → 403; editor
  create → 201 → set items (bogus dropped, order kept) → draft not public → publish → public; editor
  delete → 403, admin → 204.
- **Web (browser):** browse 3 collections → ordered detail; editor creates a collection (create +
  set-items) → publishes → appears in public `/collections` with items in order.
