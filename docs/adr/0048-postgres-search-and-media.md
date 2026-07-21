# ADR 0048 — Postgres-backed catalogue search & media

- **Status:** Accepted (supersedes ADR 0010 Meilisearch, ADR 0011 MinIO/S3)
- **Context:** The catalogue's search (`CatalogueSearch`, `CollectionSearchIndex`) and media
  (`MediaLibrary`) capabilities were served by two extra always-on services — Meilisearch and MinIO —
  each needing its own container, and, for a managed deploy, its own instance + disk. At the catalogue's
  scale (low hundreds of items) that operational and hosting cost is disproportionate, and search is
  load-bearing for the public browse experience (homepage shelves, `/catalogue`, `/collections`), so it
  can't simply be dropped.
- **Decision:** Serve both capabilities from **Postgres**, behind the existing ports (ADR 0012), so the
  runtime stack is just **web + API + Postgres**.
  - **Search** — `PostgresCatalogueSearch` / `PostgresCollectionSearch` read the published set through
    the existing repositories (`ContentRepository` / `CollectionRepository`) and apply filters, facet
    counts, sort, and pagination in memory. This mirrors the in-memory approach the related-content path
    already uses and needs no search index.
  - **Media** — `PostgresMediaLibrary` stores object bytes in a `media_objects` table (keyed by the same
    `storage_key` the metadata rows reference). `presignGetUrl`/`presignPutUrl` return the API's
    `/media?key=…` route; the browser reads bytes from `GET /media` (public, streamed) and uploads via
    `PUT /media` (RBAC `content:update`, raw body). `indexAll` and the reindex services become no-ops —
    the reindex call sites stay unchanged behind the port.
- **Consequences:**
  - No Meilisearch/MinIO containers, disks, or `MEILI_*`/`S3_*`/AWS-SDK/`meilisearch` dependencies;
    search is always consistent with Postgres (no reindex lag).
  - Text search is case-insensitive token matching weighted by field (title > summary > taxonomy names),
    not typo-tolerant like Meilisearch — acceptable at this scale. Facet labels stay slug-derived
    (`slugToLabel`), matching prior behaviour.
  - Media bytes live in Postgres and upload streams through the API (fine for admin-scale image/audio/
    score uploads). If media volume grows, add an R2/S3 adapter behind `MediaLibrary` (one binding change)
    — the port and the `/media` contract are unchanged.
  - `MediaLibrary` gained a `getObject` method (read bytes) to back the serving route.
- **Migration:** `media_objects` added via Drizzle migration; the seed writes score alphaTex text into it
  through the same `MediaLibrary.putObject` path.
