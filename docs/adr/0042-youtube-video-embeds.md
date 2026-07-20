# ADR 0042 — YouTube video embeds for catalogue content

- **Status:** accepted
- **Date:** 2026-07

## Context

Visitors learning a piece frequently want to jump to a video that *demonstrates* it — a convenience that
matters most for course and lesson material. The catalogue had no way to attach a video. Media assets
(`score_pdf | audio | image | alphatex`, ADR 0028) are object-storage files keyed by `storageKey`, so a
URL-only external link is a poor fit for that table. The content-embeds pipeline (ADR 0028/0030) already
carries preconfigured interactive tools opaquely through `details.embeds` JSONB, renders them inline with
the prose (`ContentEmbeds`/`ContentBody`), and authors them in the block editor's "Insert tool" menu.

## Decision

1. **A video is a new embed tool, not a media asset.** `youtube` joins the `ContentEmbed.tool` union
   (TypeSpec `main.tsp` + domain + serde `EMBED_TOOLS` — the three tool-list sources of truth). It rides in
   `details.embeds` JSONB with **no migration**, gets inline placement and CMS authoring for free, and
   reuses the whole embeds pipeline. Config: `videoUrl` (input), `start`, `title`/`caption`, plus fields
   cached at author time (`videoId`, `thumbnailUrl`, `videoAuthor`, optional `uploadDate`).
2. **Previews are resolved server-side at author time via YouTube's keyless oEmbed endpoint and cached
   into the embed.** A `VideoPreviewLookup` capability port → `YouTubeOembedVideoPreviewLookup` adapter
   (ADR 0012) fills title/author/thumbnail. Enrichment runs in the create/update use-cases and in the
   `content:build` seed script. The video id + a deterministic `i.ytimg.com` thumbnail always resolve from
   the URL, so a failed/timed-out lookup never blocks a save — it degrades to the deterministic thumbnail.
   Caching means the read side needs no runtime network call and the metadata is crawler-visible.
3. **The block editor shows a live preview via `GET /videos/preview`.** The inspector calls it (debounced)
   as the author pastes a URL, prefilling the resolved title + thumbnail; the author can still override the
   title. The route is RBAC-gated (`content:update`).
4. **The read side is a lazy facade, using `youtube-nocookie`.** `YouTubeEmbed` (`@TheY2T/tmr-ui`, a
   presentational i18n-by-prop molecule) renders a themed thumbnail + play button and swaps in the
   `youtube-nocookie` iframe only on click — so the page ships none of YouTube's ~500KB iframe weight up
   front and sets no third-party cookies until the viewer opts in.
5. **No new feature flag.** The tool appears in the insert menu whenever `admin.block-editor` is on, and the
   read side always renders authored video embeds — matching the other embed tools, which are ungated on the
   public side.
6. **SEO emits `VideoObject` JSON-LD** (`videoObjectJsonLd`, ADR 0039) from the cached metadata, surfaced
   server-side through `fetchContentMeta`. `uploadDate` is a Google-required rich-result field that oEmbed
   cannot supply, so it is emitted only when an author provides it; `name`/`thumbnailUrl`/`embedUrl` are
   always present.

## Consequences

- Authors add a demonstration video with just a URL, in the same editor and inline placement as every
  other embed; the preview title/thumbnail generate automatically.
- oEmbed introduces a best-effort external dependency at author/build time only (never on the read path);
  it is non-fatal and falls back to a deterministic thumbnail. Titles are cached, so a later re-title on
  YouTube is picked up only on the next save/rebuild.
- Full `VideoObject` rich-result eligibility requires the optional `uploadDate`; without it the markup is
  still valid but not rich-result-eligible. A future change could fetch `uploadDate`/`duration` from the
  YouTube Data API (needs a key) if richer results are wanted.
- If a Content-Security-Policy is introduced, `youtube-nocookie.com` must be allowlisted in `frame-src` and
  `i.ytimg.com` in `img-src`.
