# ADR 0023 — Collections Library (rich metadata, sections, engagement)

- **Status:** accepted
- **Date:** 2026-07-14
- Supersedes the thin Phase-2 collections (ADR-less, see `docs/features/collections.md` history).

## Context

Collections shipped as flat metadata + an ordered slug list. The goal was a "verbose" library: rich
editorial metadata, chaptered structure with per-item notes, file-based authoring, real discovery, and
full engagement (progress, save, rate, user-created).

## Decisions

1. **`collection_items` gets its own `id` uuid PK** (dropping the composite `(collection_id, content_id)`
   PK), plus `section_id`, `curator_note`, `focus_skills`, with `UNIQUE(collection_id, content_id)` to
   keep the no-duplicate invariant. Rationale: a stable per-membership identity is needed to annotate and
   reorder items across sections. Safe because the seed replaces items every run and integration tests
   migrate fresh; the generated migration backfills `id` with `gen_random_uuid()` before `NOT NULL`.

2. **Sections tier** (`collection_sections`) between a collection and its items; the domain keeps a
   **flattened, section-ordered `itemSlugs`** so the progress module is untouched (its load-bearing read).

3. **File-based Markdown authoring** (`content/collections/*.md` → `collections:build` → `seed-collections.ts`),
   mirroring the catalogue content pipeline. Admin CMS remains for edits.

4. **New capability ports** (ADR 0012 naming): `CollectionBookmarks`, `CollectionRatings`,
   `CollectionSearchIndex`, and a thin `LearnerProgress` (reads `content_progress`) — the last avoids a
   circular module dependency, since `ProgressModule` already imports `CollectionsModule`.

5. **Meilisearch `collections` index** for discovery (facets + sort), reindexed on seed + every write.
   **Private user collections are never indexed** and are excluded from `findAllPublished`.

6. **Engagement gated by discrete flags** (`collections-discovery/-bookmarks/-ratings`, `user-collections`);
   per-collection progress reuses `learning.progress`. Auth routes are `@RequireAuth`; **user-collection
   ownership is enforced in the use-cases** (403), never from the path. Admin reuses the `content` RBAC
   resource.

7. **Breaking contract change:** `CollectionItemsInput` moved from `{ contentSlugs: string[] }` to
   `{ items: CollectionItemInput[] }` (structured, with notes + section links). Landed in lockstep across
   TypeSpec, generated DTOs, the admin CMS, and the seed.

## Consequences

- Richer detail/discovery/engagement UX; graded syllabi and chaptered paths are expressible.
- Discovery depends on Meilisearch being up (same as the catalogue); reindex-on-write is best-effort so a
  down index never fails a write.
- The progress module is insulated by the `itemSlugs` contract + a regression test.
