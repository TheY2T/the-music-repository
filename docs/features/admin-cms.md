# Feature: Admin CMS (content authoring)

- **Phase:** 1 (Slice 2b) · **Status:** shipped
- **Flag key:** `admin.cms` (from `@TheY2T/tmr-flags`) — gates the `/admin` authoring UI. Default on.

## Purpose

Let editors/admins create, edit, publish, and delete catalogue content, attach media, and manage
taxonomy — all RBAC-gated and spec-first, with writes reindexed into search immediately.

## UX behaviour

- `/admin` — content table (all statuses) with status badges + **New content**. SSR-gated to
  editor/admin (learners/anon are redirected).
- `/admin/content/new` and `/admin/content/[slug]/edit` — a `ContentForm` island: fields, a
  **Markdown body editor with live preview** (`marked`), taxonomy inputs (comma-separated slugs with
  datalist suggestions; unknown slugs are auto-created), and (edit mode) **Publish / Unpublish /
  Delete** + a **media uploader**.
- **Media upload** is a two-step presigned PUT: the API reserves a row + returns an upload URL, the
  browser PUTs the file **directly to MinIO** (whose default CORS is permissive; the app also tries a
  best-effort `PutBucketCors` on boot, ignored where the storage doesn't implement it).
- Published items appear immediately in `/catalogue` (reindex-on-write).

## Data model

Reuses the catalogue tables (`content_items`, `media_assets`, taxonomy + joins). No new tables. The
authoring adapter writes rows + join records and auto-creates taxonomy terms.

## API contract

Paths from TypeSpec (`packages/api-spec/main.tsp`), tag `authoring`; generated hooks/types in
`@TheY2T/tmr-api-client`, DTOs in `@TheY2T/tmr-contracts`. Every route is `@RequirePermissions`-gated:

| Route | Permission | Notes |
|---|---|---|
| `GET /content` | `content:update` | admin list (any status) |
| `POST /content` | `content:create` | creates a draft (201) |
| `GET /content/{slug}` | `content:update` | any-status detail for editing |
| `PUT /content/{slug}` | `content:update` | replace + reindex |
| `POST /content/{slug}/publish` \| `/unpublish` | `content:publish` | reindex |
| `DELETE /content/{slug}` | `content:delete` | admin only; reindex (204) |
| `POST /content/{slug}/media` | `media:create` | presigned PUT ticket (201) |
| `GET /taxonomy/{dimension}` | `content:update` | genres/instruments/topics/tags |
| `POST /taxonomy/{dimension}` | `taxonomy:create` | upsert a term (201) |

Hexagonal: use-cases depend on the `ContentAuthoring` + `TaxonomyCatalog` ports (writes) and reuse the
catalogue `ContentRepository` / `MediaLibrary` / `CatalogueReindexService`. Adapters:
`DrizzleContentAuthoring`, `DrizzleTaxonomyCatalog`, `S3MediaLibrary` (presigned PUT + bucket CORS).

## Help topics

None yet (Info View arrives in Phase 2).

## Tests

- **Backend (curl):** learner write → 403; invalid body → 422 problem+json with `errors[]` pointers;
  editor create → 201; publish → 200 then appears in `/catalogue` (typo-tolerant Meili search); editor
  delete → 403, admin delete → 204; media presigned PUT + presigned GET both 200; invalid taxonomy
  dimension → 400.
- **Web (browser):** editor signs in → `/admin` list → create (live preview) → publish → upload PDF
  (direct-to-MinIO) → item + score viewer visible in public `/catalogue`; learner is redirected from
  `/admin` and sees no Admin link.
- **Setup:** `pnpm infra:up`, migrate + `db:seed` + `db:seed:auth`, run both apps.
