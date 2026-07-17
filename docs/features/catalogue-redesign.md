# Feature: Catalogue redesign — hub, axis switcher & shelves

- **Phase:** Platform/UX · **Status:** Phases 1–2 + 4–5 shipped (hub shelves + axis switcher + level facet + sort; collections & tools federated; signed-in dashboard at `/dashboard`; composer + key facets). The **Atlas** intersection mode (Phase 3) was trialed and **reverted** (a count matrix gave weak content signal — see ADR 0031).
- **Flag key:** `catalogue.hub` (hub) · `learning.dashboard` (signed-in dashboard) — from `@TheY2T/tmr-flags`
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
  (`?by=level`) and remembered for the session (`sessionStorage['tmr.catalogue.hubAxis']`), so re-entering
  the hub without a `?by=` — a shared `?view=browse` link, or simply returning later — restores the last
  axis instead of snapping back to the default. The collections hub mirrors this (`tmr.collections.hubAxis`).
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

**Signed-in dashboard** (`/dashboard` → `StudioDashboard`, gated on `learning.dashboard` &&
authenticated — anonymous redirects to sign-in): the personal counterpart to the public catalogue,
kept off the catalogue so browsing isn't conflated with personal state. Rows: *Pick up where you left
off* (recently-viewed items from browse history), *More like {latest}* (the related-content endpoint on
the latest item), and *Saved* (favorites); an empty state links to the catalogue. Surfaced as the first
primary-nav item for signed-in users.

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
| Collections | separate `collections` Meili index (ADR 0023) | Federate onto the catalogue hub as "path" cards; the **collections page** has its own parallel hub (`CollectionsHub`, flag `learning.collections-hub`) — axis switcher (Kind/Era/Instrument) + Hub/Browse toggle over `CollectionsGrid`, mirroring the catalogue |
| **Composer** (shipped) | `details.composer` JSONB | Indexed verbatim into Meili (`toIndexDoc` + `filterableAttributes`); Composer facet |
| **Key** (shipped) | `details.key` JSONB | **Normalized** to a primary key (`normalizeKey`, strips qualifiers after `(`/`,`/`;`) then indexed; Key facet |

Meili `content_items`: filterable `genreSlugs, instrumentSlugs, topicSlugs, era, composer, key, type,
difficulty, visibility`; sortable `title, difficulty`. Composer/key facet values are display strings
(value == label, like era). The Composer/Key facet groups show the top ~12 values; selected values
beyond that stay removable via the applied-filter chips.

## API contract

- **Shipped:** `GET /catalogue/items` (`useSearchCatalogue`) gained `difficultyMin/difficultyMax` + `sort`
  query params (spec-first in `packages/api-spec/main.tsp` → `pnpm spec:generate`; `normalizeQuery` +
  `CatalogueSearch` port + Meili range/sort). Hub shelves compose client-side via parallel calls with
  distinct `CatalogueQuery`s; collections shelf reuses `useSearchCollections`.
- **Phase 4:** recommendations reuse the related-content overlap logic (`get-related-content.use-case`)
  generalised to a viewer's recent taxonomy.

## Help topics

The grade/level facet header carries `data-help="grade"` (via `FacetGroup.helpSlug` → `FacetPanel`), so
hovering it opens the Info View panel explaining the 1–10 rating and its bands. The `grade` `help_topic`
is seeded in `seed-data.ts`. The axis switcher is self-explanatory and has no help entry.

## Tests

Per ADR 0020 (Definition of Done):
- **Unit** — `difficultyMin/Max` + `sort` normalisation (`catalogue.controller.test.ts`); band
  aggregation, shelf/axis builders, level→difficulty mapping (`catalogue-shelves.test.ts`); flagship
  tools filter (`tools-taxonomy.test.ts`). Mock the `CatalogueSearch` port, never Drizzle/Meili.
- **Hook-driven islands** (Hub, grid, shelves) are verified end-to-end in the running app (dup-React
  blocks their unit rendering, per ADR 0020).

Run: `pnpm test` · `pnpm test:integration` · `pnpm test:e2e`. Verify end-to-end against the local app
(web :4321 / api :3000 / `pnpm infra:up`) per the `verify` skill.
