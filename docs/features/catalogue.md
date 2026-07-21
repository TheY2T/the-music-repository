# Feature: Catalogue (read path)

- **Phase:** 1 · **Slice:** 1 · **Status:** shipped (public read-only)
- **ADRs:** [0048 Postgres search & media](../adr/0048-postgres-search-and-media.md) (supersedes
  [0010](../adr/0010-search-meilisearch.md) / [0011](../adr/0011-media-minio-s3.md))

## Purpose

The core repository: browse & search teaching materials and songs, faceted by type, genre, instrument,
difficulty, and topic; view a content item with its score (PDF) and recordings.

## Data model

`content_items` + taxonomy (`genres`, `instruments`, `skill_topics`, `tags`) via join tables +
`media_assets` (object key + license/attribution). See `apps/api/src/infrastructure/database/schema.ts`.

### Enriched content (`details` JSONB + curated related)

Every item carries a rich Markdown `body_mdx` (rendered on the detail page) and a `details` JSONB
column of structured facts (`ContentDetails` in `catalogue/domain/content-item.ts`: `key`, `era`,
`form`, `timeSignature`, `composer`, `composerDates`, `composedYear`, `related[]`). The detail page
shows `key/era/form/composer/…` as a **Details panel**; `era` drives a catalogue **Era facet**
(search-derived from `details.era`, no SQL taxonomy table — `Folk` is normalised to `Traditional`); `related[]` is
served as curated **"if you like this"** links (`GetRelatedContentUseCase` prefers them, falls back to
the algorithmic overlap query). The `details` DTO omits `related` (it's an internal link list).

**Authoring the content:** bodies + facts live as one Markdown file per item under
`apps/api/src/infrastructure/database/content/<slug>.md` (frontmatter + body). Regenerate the bundled,
build-safe `seed-content.ts` with `pnpm --filter @TheY2T/tmr-api content:build`; the seed applies it on
top of the base `seed-data.ts` metadata (and attaches `extraTags` that exist in the `TAGS` vocabulary).

## API (spec-first — declared in `packages/api-spec/main.tsp`)

- `GET /catalogue/items` — `q`, `genre[]`, `instrument[]`, `topic[]`, `era[]`, `type`, `difficulty`,
  `page`, `pageSize` → `{ items, facets (incl. `eras`), total, page, pageSize }`.
- `GET /catalogue/items/{slug}` → full detail with **media URLs** (served from the API's media route);
  unknown slug → 404 problem+json.
- `GET /catalogue/items/{slug}/related` *(Slice 3)* → `{ items }` — published items sharing
  genre/instrument/topic, ranked by overlap (excludes self; empty for unknown slug).

## Architecture (hexagonal, on the platform)

`apps/api/src/catalogue/` — domain (`ContentItem`, `ContentNotFoundError`), ports named for the
capability (`ContentRepository`, `CatalogueSearch`, `MediaLibrary` — see ADR 0012), use-cases
(`SearchCatalogue`, `GetContentBySlug`, `GetRelatedContent`), adapters named for the tech
(`DrizzleContentRepository`, `PostgresCatalogueSearch`, `PostgresMediaLibrary`), `CatalogueReindexService`.
**Search** filters and facets the published set in memory (ADR 0048); **detail** reads Postgres and
serves media from the `/media` route. **Related** scores taxonomy overlap over the published set in
`ContentRepository.findRelated`.

**Search ranking:** text matches are weighted `title` › `summary` › taxonomy names
(`genreNames`/`instrumentNames`/`topicNames`) — a title hit outranks a summary hit outranks a tag hit,
and queries like "blues" or "ukulele" match by tag, not just title.

## Frontend

`/catalogue` (`CatalogueBrowser.tsx`, `useSearchCatalogue`) — search box + facet checkboxes + results
grid. `/catalogue/[slug]` (`ContentDetail.tsx`, `useGetContentBySlug` + `useGetRelatedContent`) —
metadata + PDF score viewer (`<iframe>`) + audio player + attribution + a **Related** grid. Both use the
generated `@TheY2T/tmr-api-client` hooks. (Logged-in users also see favorite hearts — see
`docs/features/favorites.md`.)

## Seed

`apps/api/src/infrastructure/database/{seed,seed-data}.ts` — **25** public-domain / CC BY-SA items
(piano/guitar/ukulele/bass across classical, jazz, blues, folk, ragtime, pop, rock) with taxonomy +
generated sample media stored in `media_objects`. Run: build, then `pnpm --filter @TheY2T/tmr-api db:seed`.

## Verify

`pnpm infra:up` (db) → `db:migrate` → `db:seed`. Then:
- `GET /catalogue/items?type=score&genre=classical` → faceted results; `?q=beethoven` matches by title/tag.
- `/catalogue` browses with working facets; `/catalogue/{slug}` renders the score, media served from `/media`.

## Scope / follow-ups

Public read-only. **Slice 2:** auth + RBAC + admin CMS (writes) + favorites. Also: `@ZodResponse`
response validation, name-based facet labels (currently slug-derived), pagination UI, related content.
