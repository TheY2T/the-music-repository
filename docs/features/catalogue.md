# Feature: Catalogue (read path)

- **Phase:** 1 · **Slice:** 1 · **Status:** shipped (public read-only)
- **ADRs:** [0010 search](../adr/0010-search-meilisearch.md), [0011 media](../adr/0011-media-minio-s3.md)

## Purpose

The core repository: browse & search teaching materials and songs, faceted by type, genre, instrument,
difficulty, and topic; view a content item with its score (PDF) and recordings.

## Data model

`content_items` + taxonomy (`genres`, `instruments`, `skill_topics`, `tags`) via join tables +
`media_assets` (object key + license/attribution). See `apps/api/src/infrastructure/database/schema.ts`.

## API (spec-first — declared in `packages/api-spec/main.tsp`)

- `GET /catalogue/items` — `q`, `genre[]`, `instrument[]`, `topic[]`, `type`, `difficulty`, `page`,
  `pageSize` → `{ items, facets, total, page, pageSize }`.
- `GET /catalogue/items/{slug}` → full detail with **presigned media URLs**; unknown slug → 404 problem+json.

## Architecture (hexagonal, on the platform)

`apps/api/src/catalogue/` — domain (`ContentItem`, `ContentNotFoundError`), ports named for the
capability (`ContentRepository`, `CatalogueSearch`, `MediaLibrary` — see ADR 0012), use-cases
(`SearchCatalogue`, `GetContentBySlug`), adapters named for the tech (`DrizzleContentRepository`,
`MeilisearchCatalogueSearch`, `S3MediaLibrary`), `CatalogueReindexService`. **Search** goes to
Meilisearch (facets + typo-tolerance); **detail** reads Postgres and presigns media from MinIO.

## Frontend

`/catalogue` (`CatalogueBrowser.tsx`, `useSearchCatalogue`) — search box + facet checkboxes + results
grid. `/catalogue/[slug]` (`ContentDetail.tsx`, `useGetContentBySlug`) — metadata + PDF score viewer
(`<iframe>`) + audio player + attribution. Both use the generated `@TheY2T/tmr-api-client` hooks.

## Seed

`apps/api/src/infrastructure/database/{seed,seed-data}.ts` — 15 public-domain / CC BY-SA items with
taxonomy + generated sample PDFs uploaded to MinIO. Run: build, then `pnpm --filter @TheY2T/tmr-api db:seed`.

## Verify

`pnpm infra:up` (db + flagd + minio + meilisearch) → `db:migrate` → `db:seed`. Then:
- `GET /catalogue/items?type=score&genre=classical` → faceted results; `?q=beethovn` still matches (typo-tolerant).
- `/catalogue` browses with working facets; `/catalogue/{slug}` renders the PDF via a presigned URL.

## Scope / follow-ups

Public read-only. **Slice 2:** auth + RBAC + admin CMS (writes) + favorites. Also: `@ZodResponse`
response validation, name-based facet labels (currently slug-derived), pagination UI, related content.
