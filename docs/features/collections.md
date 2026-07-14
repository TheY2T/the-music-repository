# Feature: Collections Library

- **Phase:** 2 → Collections Library · **Status:** shipped
- **Flag keys** (from `@TheY2T/tmr-flags`):
  - `learning.collections` — master gate for browse + admin (default on).
  - `learning.collections-discovery` — faceted search/sort/shelves.
  - `learning.collections-bookmarks` — save to a personal library (auth).
  - `learning.collections-ratings` — 1..5 ratings + popularity.
  - `learning.user-collections` — user-created collections.
  - Per-collection **progress** reuses `learning.progress`.

## Purpose

A first-class, curated **collections library**: rich editorial anthologies, chaptered learning paths,
graded syllabi, and personal/user-created sets built from the catalogue. A collection carries rich
metadata, a **sections/chapters** tier with **per-item curator notes**, and drives discovery, progress,
and engagement.

## Data model

`collections` — `slug, title, summary, body_mdx, kind` (`course|path|syllabus|songlist`), `visibility`
(`public|authed|private`), `status`, `curation_type` (`editorial|user`), `owner_id` (null for editorial),
`hero_image_key, accent, featured, difficulty_min/max, est_minutes, curator_name, curator_bio, outcomes
(jsonb), facets (jsonb {era,genre,technique,mood,instrument}), tags (jsonb), popularity`.

`collection_sections` — `id, collection_id, title, description, position` (chapters).

`collection_items` — **own `id` uuid PK** (was composite), `collection_id, section_id` (nullable →
ungrouped), `content_id, position, curator_note, focus_skills (jsonb)`, `UNIQUE(collection_id, content_id)`
preserves no-duplicate-item. `collection_bookmarks` (PK `(user_id, collection_id)`), `collection_ratings`
(`rating` 1..5, PK `(user_id, collection_id)`). Migration `drizzle/0018_*`.

**Invariant:** the domain `Collection.itemSlugs` stays a flattened, section-ordered list — the progress
module (`GetProgressSummaryUseCase`) reads it. `hydrate()` must keep it in order.

## Authoring (file-based)

Editorial collections are authored as `apps/api/src/infrastructure/database/content/collections/*.md`
(frontmatter metadata + `## Outcomes` bullets + `## Section: <title>` blocks whose `- slug (note: …;
skills: [a, b])` lines become items). `pnpm --filter @TheY2T/tmr-api collections:build` bundles them to
the committed `seed-collections.ts`; the seed upserts metadata + replaces sections/items, prunes
superseded editorial collections (never user-created), then reindexes Meilisearch. 16 collections ship.

## Discovery (Meilisearch)

`collections` index (`MeilisearchCollectionSearch`, `CollectionSearchIndex` port). Searchable: title,
summary, curatorName, tags. Filterable: kind, grades (difficulty range expanded), era/instrument/
technique/mood, curatorName, featured. Sortable: featured, newest, popular, A–Z, difficulty.
`CollectionReindexService` rebuilds from published, non-`private` collections; called by the seed + after
every authoring/user write. Private user collections never enter the index or `findAllPublished`.

## API contract (tag `collections`; generated hooks/types in `@TheY2T/tmr-api-client`)

| Route | Auth | Notes |
|---|---|---|
| `GET /collections` | public | published summaries + rating aggregates |
| `GET /collections/search` | public | faceted discovery (q/kind/era/instrument/technique/difficulty/sort/page) |
| `GET /collections/{slug}` | public | published detail, grouped into sections |
| `GET /collections/{slug}/progress` | optional-auth | detail + per-item `completed`, `percentComplete`, `nextUpSlug` |
| `POST /collections/{slug}/open` | public | popularity bump (204) |
| `GET /me/saved-collections` | auth | the user's bookmarks |
| `POST\|DELETE /me/collections/{slug}/bookmark` | auth | save/unsave (204) |
| `PUT /me/collections/{slug}/rating` | auth | rate 1..5 → aggregate + your rating (422 out of range) |
| `GET\|POST /me/collections` | auth | list / create user collection |
| `GET\|PUT\|DELETE /me/collections/{slug}` | auth | owner-only (403 otherwise) |
| `PUT /me/collections/{slug}/items` | auth | owner-only ordered items |
| `GET\|POST\|PUT\|DELETE /admin/collections[...]` | `content:*` | metadata + `PUT .../items` (structured) + `PUT .../sections` + publish/unpublish |

Hexagonal: `CollectionRepository`, `CollectionBookmarks`, `CollectionRatings`, `CollectionSearchIndex`,
and a thin `LearnerProgress` port (reads `content_progress` directly — avoids a cycle with
`ProgressModule`). `CollectionDetailAssembler` groups items into sections + computes progress. Admin RBAC
reuses the `content` resource; user-collection ownership is enforced in the use-cases.

## Frontend

- `/collections` — `CollectionsBrowser` (featured hero + facets + sort + search + rich `CollectionCard`s
  with progress bar, rating, save button).
- `/collections/{slug}` — `CollectionDetail` (cover, curator, stat tiles, resume/next-up band, outcomes,
  `bodyMdx`, chaptered sections with per-item notes + completion toggles, save + rating).
- `/me/collections` — `SavedCollections` (Saved + My collections tabs); `/me/collections/new` +
  `[slug]/edit` — `UserCollectionForm` (catalogue picker + reorder + per-item notes + public/private).
- Islands: `SaveCollectionButton`, `CollectionRating`; UI: `StarRating` molecule + `MediaCard`
  `metaSlot`/`footerSlot`. `collections-api.ts` for credentialed mutations; reads via generated hooks.

## Tests

- **Unit** (mock ports): assembler section-grouping + drop/renumber + progress next-up/%; user-collection
  ownership 403; rating bounds 422; `collections-api` fetch envelopes.
- **E2E** (Playwright): index facets/sort/search + progress; detail sections/completion/resume/save/rate;
  saved tabs + anon redirect; create/reorder.

## Follow-ups (deferred)

Admin sections-editor UI (file authoring covers editorial today; admin still edits flat items + metadata),
"appears in N collections" cross-link on catalogue detail, home featured-collections shelf.
