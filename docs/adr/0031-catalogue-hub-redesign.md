# ADR 0031 — Catalogue hub redesign (curated shelves over faceted search)

- **Status:** accepted (Phases 1–2 shipped behind `catalogue.hub`)
- **Date:** 2026-07-17

> **Amendment (2026-07-17):** the **Atlas** intersection mode (a two-axis count matrix, "Variant C")
> described below was built in Phase 3 and then **reverted**. In practice a grid of item *counts* gave
> users no signal about the *content* itself, so it didn't help them judge or reach what they wanted —
> the Hub ⇄ Browse-all toggle covers the same ground more directly. The `GET /catalogue/atlas` endpoint,
> the `CatalogueAtlas` island, and the `catalogue.atlas` flag were removed. The rest of this ADR (the
> shelf hub, axis switcher, level facet, sort, collections/tools federation) stands as shipped. Atlas
> references below are retained for the historical record.

## Context

The catalogue browse page (`apps/web/src/pages/catalogue/index.astro` → `CatalogueBrowser.tsx`) is a
single **flat grid**: a facet sidebar (`type`, `genre`, `era`, `instrument`, `topic`) over a paginated
`CardGrid` of `MediaCard`s. It works, but it is the *only* mode and it under-uses the data we already
hold:

- **Skill level is invisible.** `content_items.difficulty` (1..10) is a Meilisearch
  `filterableAttribute` and its facet distribution is *computed server-side* — but no facet group
  renders it. Every course/music-learning leader (Coursera, JustinGuitar, Pianote, Fender) organises
  primarily around a **level spine**; we throw ours away at the UI.
- **No curation, no flow.** There are no editorial *shelves* — the pattern every discovery-first site
  (Netflix, Spotify, Skillshare, MasterClass, Coursera landing) leads with. Content cannot be
  contextualised ("Baroque keyboard", "Play your first song", "Grade 1–3 · Guitar").
- **Content types are siloed.** Articles/lessons (`/catalogue`), collections (`/collections`,
  ADR 0023), interactive tools (`/tools/*`), and scores each live on separate browse surfaces, so a
  learner cannot discover across them in one place.
- **Only one organising axis at a time, chosen by us.** There is no way for a user to re-slice the
  library by a different dimension (level vs era vs genre vs format), nor to browse by the *intersection*
  of two dimensions.
- **No sort, no personalisation, one experience for everyone.** The collections browser already has a
  sort control; the catalogue does not. There is no anonymous-vs-authenticated distinction.

Research across Udemy, Coursera, Skillshare, MasterClass, Domestika, JustinGuitar, Pianote, Fender,
Yousician, Soundslice, Netflix, Spotify, plus NN/g and Baymard guidance, converges on one model:
**a stack of named, horizontally-scrolling curated shelves on top of a faceted grid you drop into when
you already know what you want** — "curation for exploring, facets for narrowing."

We deliberately do **not** rebuild from scratch. Reusable primitives already exist: `Hero` and
`FeaturedShelf` molecules (`@TheY2T/tmr-ui`), `MediaCard`, `CardGrid`, `FacetPanel`, `ActiveFilters`,
`SearchField`, `SegmentedToggle`, `CoverArt`, `Pagination`; `useBrowseHistory` (recents); the
`Favorites` feature; and the Meilisearch `content_items` index. The redesign mostly *surfaces* structure
that exists.

## Decision

Rebuild the catalogue as a **hybrid hub**: a primary **Hub** of curated shelves with a re-sliceable
**axis switcher**, a secondary **Atlas** intersection-matrix mode, and the existing **faceted grid** as
the deep "narrow it down" mode underneath. Two audience states (anonymous discovery / authenticated
"My Studio"). Everything ships behind `catalogue.hub` (with `catalogue.atlas` gating the Atlas mode).

### 1. Three composed surfaces, one system

- **The Hub (primary, Variant A).** A billboard `Hero` over a **config-driven stack of shelves**
  (`FeaturedShelf`). An **axis switcher** (`SegmentedToggle`) re-labels/re-orders the shelves around the
  chosen dimension — **instrument · skill level · era · genre · goal · format** — the same catalogue,
  re-sliced. Each shelf's **See all →** hands off to the faceted grid pre-scoped to that shelf's query.
- **The Atlas (secondary, Variant C).** A "Browse by intersection" mode: the user picks any two axes
  (rows × columns); the catalogue lays out as a **heat-shaded count matrix**; clicking a populated cell
  streams that intersection into a shelf and links to the pre-filtered grid. Empty cells are dimmed and
  non-interactive (no zero-result rooms).
- **The faceted grid (deep mode).** An evolution of today's `CatalogueBrowser`, gaining a **Grade/level
  facet** (difficulty bands), a **sort control**, a **content-type/format facet**, and (Phase 5)
  **composer + key** facets, plus a mobile filter tray and an in-context level segmented toggle.

### 2. Two audience states

- **Anonymous:** discovery-first Hub — editorial/universal shelves only.
- **Authenticated ("My Studio" band above the shelves):** *Continue where you left off* (from
  `useBrowseHistory` + collection progress), *Saved* (favorites), and reason-named recommendation rows
  ("Because you practiced the ii–V–I") derived from taxonomy overlap. Auth-gated; anonymous never sees it.

### 3. Data — surface first, index second (minimise migration)

- **Level (Phase 1):** already indexed. Add a UI facet that aggregates the `difficulty` distribution
  into **bands** (Grade 1–3 / 4–6 / 7–8 / 9–10) and filters by range. The controller/`CatalogueQuery`
  gains `difficultyMin`/`difficultyMax`. **No schema change.**
- **Content-type/format:** `type` is already faceted; relabelled as **Format** and elevated from a filter
  to a browse axis. Collections keep their own `collections` Meili index (ADR 0023) and are **federated**
  onto shelves as first-class "path" cards; tools surface as catalogue entries.
- **Composer + key (Phase 5):** already on `details` JSONB (`details.composer`, `details.key`). Add them
  to the Meili `toIndexDoc` projection + `filterableAttributes` and expose facet groups. **No schema
  change** — mirrors how `era` is already Meili-derived from `details`.
- **Shelf & Atlas configuration:** shelf definitions are **saved queries** (axis-value → `CatalogueQuery`).
  Phase 1 composes shelves client-side via parallel `GET /catalogue/items` calls; a spec-first
  `GET /catalogue/shelves` and `GET /catalogue/atlas` (count matrix) endpoint follow (`add-endpoint`
  skill) when we want server-curated ordering and efficient cross-counts.

### 4. Conventions

Spec-first for any new endpoint (TypeSpec → `pnpm spec:generate`); framework-free `DomainError`s;
hexagonal use-cases depend on the `CatalogueSearch` port; ports named for the domain capability
(ADR 0012). Web: compose from `@TheY2T/tmr-ui`, **semantic tokens only** (3 aesthetics × light/dark,
ADR 0021), `Icon` atom (no emoji, ADR 0019), all strings via `@TheY2T/tmr-i18n` (en + zh-Hans,
ADR 0017). Every shelf/axis/facet gated behind `catalogue.hub`.

## Consequences

**Positive.** Discovery becomes contextual and flowing; the level spine (the missing organising
principle) is surfaced; one page unifies articles, collections, tools, and scores; users can organise the
catalogue several ways (axis switcher) and by intersection (Atlas); anonymous and authenticated learners
each get a fit-for-purpose experience; almost no migration (level/format/composer/key all already exist
in data). Reuses existing molecules, so Phase 1 is high-impact / low-effort.

**Negative / cost.** Client-side shelf composition means several search calls per Hub load until the
`/catalogue/shelves` endpoint lands (mitigated by Meili speed + caching). The Atlas count matrix needs an
efficient cross-facet count endpoint (Meili facet search per row value, or a dedicated aggregation).
Federating two Meili indexes (content + collections) onto shared shelves needs a normalising view model.
More surface area to test (unit + component + E2E per DoD).

**Rollout.** Phased behind `catalogue.hub` (Hub + level facet + sort → unify types → axis switcher +
`catalogue.atlas` + hubs → My Studio → composer/key indexing). Flag off ⇒ the current `CatalogueBrowser`
renders unchanged, so we can ship and dogfood incrementally.

## Alternatives considered

- **Pathway-first landing (Variant B).** Lead with a fixed skill-ladder progression. Rejected as the
  *primary* front door (too committing for anonymous discovery); **retained** as the hub-and-spoke spoke
  page a Hub instrument/path drills into (Phase 3), and as the shape of the Collections detail view.
- **Keep the flat grid, just add a level facet + sort.** Cheapest, but leaves discovery flat and content
  siloed — fails the "contextualised and flowing" goal. Adopted only as Phase 1's *first* increment, not
  the end state.
- **A single mega-taxonomy tree.** One rigid hierarchy forces single-path browsing (NN/g "Filters vs.
  Facets"); the multi-axis + intersection model is strictly more flexible for a library organised many
  ways.
