# ADR 0032 — Admin content manager (three-view browser over a client-side model)

- **Status:** accepted (Phase 2 shipped; behind the existing `admin.cms` flag)
- **Date:** 2026-07-17

> **Amendment (2026-07-17):** the manager pattern was **generalised** into a reusable, config-driven
> `EntityManager` (`components/admin/EntityManager.tsx`) over a pure core (`lib/admin-manager.ts`), and
> applied to two more admin surfaces:
> - **Collections** (`AdminCollectionManager` + `collection-manager-config`): full Hub/Table/Board over
>   All/Status/Kind/Instrument/Era; the board is Draft/Published (collections have no `review`) driven by
>   the existing publish/unpublish endpoints. Required exposing `status` on `CollectionSummary` (it only
>   carried `visibility`).
> - **Help topics** (`AdminHelpManager` + `help-manager-config`): a **reduced** manager — Hub (grouped by
>   Linked-to-article / Standalone) + Table + search, **no board or axis switcher**, because help topics
>   have no status or taxonomy. This is the honest fit rather than empty views.
>
> The generic manager owns the shell, control bar, search, facets, pagination, selection, optimistic
> status, and the drag board; each entity supplies a config (accessors, axes, card/table renderers,
> optional board). Content still runs on its original bespoke `AdminContentManager` (the reference the
> generic was extracted from) — a candidate to migrate onto `EntityManager` for a single implementation.

## Context

The admin content surface (`/admin` → `AdminContentList`) was a single **flat table of every content
item**, all statuses, with no search, filter, sort, or pagination. At ~90 items it was already an
unbroken scroll; it gave an editor no way to find a piece, see what was mid-workflow, or organise the
library. Meanwhile the public catalogue had just gained a curated hub (ADR 0031) — the admin side was
the last un-modernised browse surface.

Two facts shape the design:

- **Admin is a *work* surface, not a discovery one.** The public hub's shelves say "here's something
  great to explore"; an editor instead needs to *find the thing, see its state, and act on it*. So the
  dominant organising axis here is **status** (workflow), not instrument/era.
- **Admin needs drafts + review items**, so it reads from the authoring repository (`listAll()`), **not**
  the public Meilisearch index (which only holds published items). The catalogue's server-side facets
  are therefore unavailable; admin faceting had to come from somewhere else.

## Decision

**One island, three views, one client-side model.** `AdminContentManager` replaces the flat list. A
single control bar drives an **organise-by axis switcher** (*All · Status · Type · Instrument · Genre ·
Era · Difficulty*) and a **Hub | Table | Board** view toggle (both remembered in `sessionStorage`).

- **Hub** — status shelves (default order *review → draft → published*, pending work first) of compact
  cards; a search box filters rows *before* grouping so shelves narrow live; each `FeaturedShelf` shows a
  right-edge **→** affordance when it overflows.
- **Table** — search + facet rail + sort + bulk-select (batch status change) + pagination.
- **Board** — a Draft / Review / Published kanban; drag a card between columns to change status, with
  each column paging in 10 cards at a time. The card **⋯ menu is the keyboard-accessible equivalent** of
  the drag (the drop targets are a pointer-only enhancement).

**Everything is computed in memory.** The manager fetches the whole list once and does all grouping,
faceting, filtering, and sorting client-side — pure, framework-free logic in
`apps/web/src/lib/admin-content-shelves.ts` (unit-tested without rendering the island). At this scale
(~100 items) this is far simpler than a server-side query contract and keeps every view instant. If the
library grows large enough to matter, the seam to add server-side `q/status/sort/page` params to
`GET /content` is isolated to the data-load call.

**Two backend changes, both spec-first:**

1. **Enriched admin list.** `ContentAdminSummary` / `ContentAdminRow` gained `tier · era · genres[] ·
   instruments[]` so the Instrument/Genre/Era axes, the Table facets, and the card tags have data.
   `DrizzleContentAuthoring.listAll` batches two taxonomy joins (no N+1) and reads `era` from `details`
   + the `tier` column.
2. **Generic status endpoint.** There was only `publish` (→ published) and `unpublish` (→ draft); no way
   to reach **review**. Added `POST /content/{slug}/status` with `{status}` (draft/review/published),
   reusing `SetContentStatusUseCase` (widened to accept `review`). Status changes reindex the catalogue
   (a move out of `published` removes the item from the public index); only `published` snapshots a
   revision. `publish`/`unpublish` stay as back-compat shortcuts.

Status mutations from the manager are **optimistic** — the row moves immediately and the change persists
via the endpoint; on error the manager resyncs from the server.

## Consequences

- The admin surface now mirrors the public hub's interaction language (axis switcher + view toggle +
  session memory), reusing `FeaturedShelf`, `FacetPanel`, `SegmentedToggle`, `Table`, `DropdownMenu`.
- The `→` scroll affordance was added to the shared `FeaturedShelf`, so **every** shelf in the app (the
  catalogue and collections hubs included) now hints when it can scroll further.
- Admin no longer depends on Meilisearch for browsing — it reads authoritative Drizzle state, so drafts
  and review items are always visible and correctly counted.
- **Deferred to later phases:** streamlined create (quick-add drawer, duplicate-as-template, inline
  add-per-type) and the unified metadata-in-editor authoring surface (Phase 4). This ADR covers the
  browse/organise uplift and the status workflow only.
