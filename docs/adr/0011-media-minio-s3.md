# ADR 0011 — Media storage: MinIO (S3-compatible) + presigned URLs

- **Status:** Superseded by ADR 0048 (media is now stored in Postgres and served via the API)
- **Context:** The catalogue hosts scores (PDF), audio, and images. We want a production-like path that
  swaps to real S3 later, without proxying large files through the API.
- **Decision:** **MinIO** (S3-compatible) in the core compose; the API accesses it via the **AWS SDK v3**
  (`@aws-sdk/client-s3` + `s3-request-presigner`) behind the `MediaLibrary` port (ADR 0012). Detail responses embed
  **time-limited presigned GET URLs**, so the browser fetches media directly. Swapping to AWS S3 later is
  config-only (endpoint + credentials).
- **Presigned-URL host caveat:** the SDK signs against the endpoint it's configured with. Inside the
  compose network that's `minio:9000` (unreachable from the browser), so `S3_PUBLIC_ENDPOINT`
  (`localhost:9000` / the public host) is used to rewrite the signed URL's host. For local dev (API on the
  host) both are `localhost:9000`. `forcePathStyle: true` is required for MinIO.
- **Consequences:** no media bytes flow through the API; URLs expire (1h) and are regenerated per request.
  Bucket is auto-created on seed (`ensureBucket`).
