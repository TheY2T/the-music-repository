# Content embeds — preconfigured interactive tools in catalogue articles

Catalogue articles can render preconfigured, interactive learning tools below their prose. This turns a
text-only lesson into something the reader plays. See ADR 0028 and the **`embed-tool`** skill (the
authoring reference + full tool catalogue).

## Authoring

Add a fenced ```embeds block (a JSON array of `ContentEmbed`) anywhere in a content Markdown file
(`apps/api/src/infrastructure/database/content/<slug>.md`). The build strips the block from the prose
and stores it in `details.embeds`; embeds render below the body in array order, each in a titled card.

```embeds
[
  { "tool": "scale-boxes", "title": "The five shapes", "root": "A", "scale": "minor-pentatonic" },
  { "tool": "chord-diagrams", "instrument": "ukulele", "chords": ["C","G","Am","F"] }
]
```

`ContentEmbed` fields: `tool` (required), `title`, `caption`, and per-tool config — `tex`/`mode`/`tuning`
(score), `root`/`scale`/`size` (keyboard, scale-boxes), `instrument`/`chords` (chord-diagrams),
`key`/`chords` (progression). Full field docs + the six tools + worked examples are in the `embed-tool`
skill.

## YouTube video embeds

A `youtube` embed places a video demonstrating the piece inline with the prose. Author it with just the
URL:

```embeds
[
  { "tool": "youtube", "videoUrl": "https://youtu.be/dQw4w9WgXcQ", "caption": "Watch it performed" }
]
```

Config: `videoUrl` (required), optional `start` (seconds), `title`/`caption`. At author time the video
`title`, `thumbnailUrl`, `videoAuthor`, and 11-char `videoId` are resolved from **YouTube's keyless oEmbed
endpoint** and cached into the embed — so the stored embed carries a crawler-visible preview and the read
side needs no runtime network call. The lookup is a domain capability (`VideoPreviewLookup` port →
`YouTubeOembedVideoPreviewLookup` adapter, ADR 0012); if it fails the deterministic `i.ytimg.com`
thumbnail is used. In the CMS, the block-editor inspector calls `GET /videos/preview` as the author pastes
a URL, showing the resolved title + thumbnail live.

The read side renders a compact **facade** (`YouTubeEmbed` in `@TheY2T/tmr-ui`): a small inline
thumbnail + title that reads as a video link and expands to the `youtube-nocookie` player on click, so the
page ships none of YouTube's iframe weight and sets no cookies until the viewer opts in. It carries its own
title/caption, so it skips the titled-card chrome the interactive tools use. Catalogue detail pages emit `VideoObject` JSON-LD from the
cached metadata (`videoObjectJsonLd` in `apps/web/src/lib/seo.ts`); `uploadDate` — a Google-required rich-
result field oEmbed can't supply — is an optional author field.

## Pipeline

`content/*.md` → `pnpm --filter @TheY2T/tmr-api content:build` (`build-seed-content.mjs` parses the
```embeds block; **fails on bad JSON or an unknown tool**) → `seed-content.ts` → seed writes `details`
JSONB → `ContentDetail.embeds` (spec-first: `ContentEmbed` in `packages/api-spec/main.tsp`,
`pnpm spec:generate`) → web `ContentEmbeds` (`apps/web/src/components/content/ContentEmbeds.tsx`) maps
each embed to a lazy-loaded, preconfigured tool island. Pure resolution helpers (note→pitch-class, chord
lookup, tuning) live in `apps/web/src/lib/embeds.ts`.

## Adding a new embeddable tool

1. Give the tool island optional initial-state props (keep the existing `/tools/*` defaults so that page
   is unchanged).
2. Add the `tool` id to the `ContentEmbed` union (TypeSpec + domain) and the build's `EMBED_TOOLS` set,
   `pnpm spec:generate`.
3. Add a `case` in `ContentEmbeds`' `EmbedBody` mapping the embed fields → the island's props, and a
   default title key in `DEFAULT_TITLE` (+ i18n `embed.*`).
4. Document it in the `embed-tool` skill.

## Gotchas

- Inline `score` alphaTex is parsed by **`pnpm --filter @TheY2T/tmr-api scores:validate`** (it re-parses
  every `.alphatex` file **and** every inline `score` embed `tex` through alphaTab), so a broken score
  fails the gate. `content:build` only checks the embed JSON + `tool`. Still proof it visually/aurally in
  the browser; keep the alphaTex minimal (see the `add-score` skill).
- The renderer is inside the `client:load` `ContentDetail` island, so tools hydrate normally; embeds are
  lazy-loaded to keep the catalogue bundle lean.
- Author embeds in the `.md` — never hand-edit `seed-content.ts` (generated). Titles/captions are author
  prose (not run through `t()`); write them in the article's language.
- Generic tools (ear trainers, metronome, fretboard, scale-explorer, …) take no props and aren't
  embeddable yet — link to `/tools/x` in prose, or parameterise them first.
