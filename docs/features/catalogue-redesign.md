# Feature: Catalogue redesign — hub, axis switcher & shelves

- **Phase:** Platform/UX · **Status:** Phases 1–2 shipped (hub shelves + axis switcher + level facet + sort; collections & tools federated onto the hub). The **Atlas** intersection mode was trialed and **reverted** (a count matrix gave weak content signal — see ADR 0031). Phases 4–5 planned.
- **Flag key:** `catalogue.hub` — from `@TheY2T/tmr-flags`
- **ADR:** [0031](../adr/0031-catalogue-hub-redesign.md) · builds on [0023 collections](../adr/0023-collections-library.md), [0021 themes](../adr/0021-multi-theme-vintage-design-system.md), [0018 design system](../adr/0018-ui-component-library-atomic-design.md)

## Purpose

Turn the flat catalogue grid into a **contextualised, flowing discovery hub**. Surface the skill-level
spine we already store, present articles + collections + tools + scores together, let users organise the
library several ways (an axis switcher), and give anonymous vs. authenticated learners fit-for-purpose
experiences — with the faceted grid retained underneath for precise narrowing.

## UX behaviour

**The Hub** (`/catalogue`, flag on) — the default view:
- **Billboard hero** (`Hero`) — one high-conviction call to action into Browse.
- **Persistent view toggle** (`SegmentedToggle`, top-right) — **Hub ⇄ Browse all**, the single
  affordance for flicking between the shelf hub and the faceted grid. State is URL-reflected
  (`?view=browse`) and preserves the active filters when switching.
- **Axis switcher** (`SegmentedToggle`) — *Instrument · Skill level · Era · Genre · Format*. Changing it
  re-labels and re-orders the shelves around that dimension (the same catalogue, re-sliced). URL-reflected
  (`?by=level`).
- **Shelf stack** (`FeaturedShelf`) — one row per top facet value of the chosen axis (fixed grade bands
  for the level axis), plus evergreen **Collections & guided paths** (federated from the `collections`
  index, wide "path" cards via `CollectionCard`) and **Interactive tools** rows. Each axis shelf's
  **See all →** opens the faceted grid pre-scoped to that shelf's query; the collections/tools rows link
  out to `/collections` and `/tools`. Empty shelves render nothing (a re-sliced axis never shows dead rows).
- **Cards** (`MediaCard`) surface: content-type, grade/level badge, genre+instrument tags, premium lock,
  and save ♥.

**Deep mode — the faceted grid** (`CatalogueGrid`, reached from the toggle or any See all):
- Left facet sidebar with **Grade/level** (difficulty bands, single-select range), Type, Genre, Era,
  Instrument, Topic; a **sort** control (relevance / difficulty asc·desc / title); applied-filter chips
  with clear-all; recents; pagination. Opens pre-scoped when entered from a shelf.

**Planned — "My Studio" band** (Phase 4, above the shelves when signed in): *Continue where you left off*,
*Saved*, taxonomy-overlap recommendations. Anonymous users never see this band.

Theming: **semantic tokens only** (3 aesthetics × light/dark, ADR 0021). Icons via the `Icon` atom
(ADR 0019). All strings via `t(locale, key)` (en + zh-Hans, ADR 0017).

## Data model

**No schema migration** for Phases 1–4. All dimensions already exist:

| Dimension | Source | Change |
|---|---|---|
| Skill level | `content_items.difficulty` (int 1..10) — Meili `filterableAttribute` | Aggregate into bands in the facet UI; `CatalogueQuery` gains `difficultyMin/Max` |
| Format | `content_items.type` — already faceted | Promote `type` to a browse axis |
| Genre / Instrument / Topic | SQL taxonomies + Meili slug facets | Reuse as axes |
| Era | `details.era` → Meili `era` facet | Reuse as axis |
| Collections | separate `collections` Meili index (ADR 0023) | Federate onto the hub as "path" cards |
| **Composer** (Phase 5) | `details.composer` JSONB | Add to Meili `toIndexDoc` + `filterableAttributes`; new facet |
| **Key** (Phase 5) | `details.key` JSONB | Add to Meili `toIndexDoc` + `filterableAttributes`; new facet |

Meili `content_items` today: filterable `genreSlugs, instrumentSlugs, topicSlugs, era, type,
difficulty, visibility`; sortable `title, difficulty`. Phase 5 adds `composer, key` to filterable.

## API contract

- **Shipped:** `GET /catalogue/items` (`useSearchCatalogue`) gained `difficultyMin/difficultyMax` + `sort`
  query params (spec-first in `packages/api-spec/main.tsp` → `pnpm spec:generate`; `normalizeQuery` +
  `CatalogueSearch` port + Meili range/sort). Hub shelves compose client-side via parallel calls with
  distinct `CatalogueQuery`s; collections shelf reuses `useSearchCollections`.
- **Phase 4:** recommendations reuse the related-content overlap logic (`get-related-content.use-case`)
  generalised to a viewer's recent taxonomy.

## Help topics

Register Info View (`help_topic`) entries for the axis switcher ("Organise by…") and grade/level bands.

## Tests

Per ADR 0020 (Definition of Done):
- **Unit** — `difficultyMin/Max` + `sort` normalisation (`catalogue.controller.test.ts`); band
  aggregation, shelf/axis builders, level→difficulty mapping (`catalogue-shelves.test.ts`); flagship
  tools filter (`tools-taxonomy.test.ts`). Mock the `CatalogueSearch` port, never Drizzle/Meili.
- **Hook-driven islands** (Hub, grid, shelves) are verified end-to-end in the running app (dup-React
  blocks their unit rendering, per ADR 0020).

Run: `pnpm test` · `pnpm test:integration` · `pnpm test:e2e`. Verify end-to-end against the local app
(web :4321 / api :3000 / `pnpm infra:up`) per the `verify` skill.
