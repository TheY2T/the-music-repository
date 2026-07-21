# ADR 0010 — Catalogue search: Meilisearch

- **Status:** Superseded by ADR 0048 (catalogue search is now served from Postgres)
- **Context:** The catalogue needs typo-tolerant full-text search with faceted filtering (genre,
  instrument, topic, type, difficulty) and counts. Options: Postgres `tsvector`, Meilisearch, Typesense.
- **Decision:** **Meilisearch** — simplest ops (single container, no schema migration), first-class
  faceting with distributions, and typo-tolerance out of the box. Runs in the core compose.
- **Design:** documents are denormalised (`genreSlugs[]` etc. for filtering/faceting + `genres[{slug,name}]`
  for display). Filters use per-facet OR (nested arrays) and across-facet AND; only `visibility = public`
  is searchable. Behind the `CatalogueSearch` port (ADR 0012), so swapping to Typesense/Postgres is an adapter change.
  The index is rebuilt from Postgres by `CatalogueReindexService` (seed now; after CMS writes in Slice 2).
- **Consequences:** search is eventually-consistent with Postgres (reindex on write). Facet labels are
  currently slug-derived (`slugToLabel`); name-based labels are a follow-up.
- **Gotcha:** `meilisearch` 0.59 ships **exports-only** (no `types`/`main`) and the class is exported as
  `Meilisearch`; the API's classic module resolution needs a `paths` mapping to its `.d.ts` (see
  `apps/api/tsconfig.json`).
