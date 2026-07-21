# WYSIWYG Block Editor

A live, in-admin authoring surface for catalogue content — composed from the design system and the site's
real interactive tools, with a full-fidelity preview. It replaces the file-pipeline-only path for authoring
`body_mdx`, structured facts, and interactive `embeds`. See **ADR 0030** for the decision record.

## At a glance

- **DB-first.** The editor writes to the DB via the authoring API; a published item is searchable
  immediately (search reads live from Postgres) and the page renders immediately (runtime,
  React-Query-backed). The file pipeline (`content/*.md` →
  `content:build` → seed) is now the importer that derives `body_doc` at build time.
- **Engine:** TipTap (ProseMirror), headless, styled from `@TheY2T/tmr-ui` + design tokens.
- **Storage:** the canonical TipTap doc lives in `content_items.body_doc` (jsonb); `body_mdx` (with embed
  markers) + `details.embeds` are **derived** from it on save so the public render path is unchanged.

## Pieces

| Piece | Where |
|---|---|
| Serialization (`docToMdx` / `mdxToDoc`) | `packages/content-serde` (`@TheY2T/tmr-content-serde`) — also owns the canonical `EMBED_TOOLS` list |
| Editor island | `apps/web/src/components/admin/block-editor/BlockEditor.tsx` (`client:only`) |
| Embed node view | `.../EmbedNodeView.tsx` — renders the real `EmbedCard` + configure/remove toolbar |
| Inspector | `.../EmbedInspector.tsx` (Sheet) driven by per-tool schemas in `.../embed-fields.ts` |
| Custom nodes | `.../nodes.ts` (`tmrEmbed`, `htmlBlock`) |
| Live preview | `.../PreviewPane.tsx` (parent iframe) + `.../ContentPreview.tsx` (iframe island) + `src/pages/admin/preview/[slug].astro`; protocol in `src/lib/preview-protocol.ts` |
| Write path | `apps/api/src/authoring/` — `ContentWriteInput` gains `details/related/embeds/tier/bodyDoc`; the Drizzle adapter overlay-merges `details` on update |

## How the round-trip works

1. **Open.** The editor loads `body_doc` when present, else falls back to `mdxToDoc(bodyMdx, embeds)`
   (corpus-proven equivalent) so legacy/file-authored content edits losslessly.
2. **Edit.** Rich text via the toolbar; "Insert tool" drops one of the 11 interactive embeds as a
   `tmrEmbed` node rendered by its real component; the Sheet inspector edits its config.
3. **Preview.** On each change (debounced) the editor `postMessage`s `{ title, bodyMdx, embeds }` to the
   preview iframe, which renders the real `ContentBody` (marked → interleaved prose + `EmbedCard`s) inside
   `BaseLayout` — exact shipped fidelity, including the active theme.
4. **Save.** `docToMdx(editor.getJSON())` yields `{ bodyMdx, embeds }`; the form PUTs
   `{ …, bodyDoc, bodyMdx, embeds }`. The adapter stores `body_doc` and overlays `embeds` onto the existing
   `details` (preserving facts + curated `related`, which the read view hides).

## Beyond catalogue articles

- **Help topics + collection descriptions** reuse `BlockEditor` in the **`minimal` profile** (prose +
  basic marks, no interactive embeds, no tables), storing plain `body_mdx` (no `body_doc`).
- **Collections** additionally get **dnd-kit** section reordering — a keyboard-accessible drag handle
  (`grip-vertical`) per section, `verticalListSortingStrategy`, and localized screen-reader announcements
  on the `DndContext`. dnd-kit is reserved for these non-prose sortable lists (the prose itself reorders
  inside ProseMirror).
- **Standalone scores** (`type: 'score'`): an alphaTex editor + live `AlphaTexScore` preview; saving PUTs
  `/content/{slug}/score`, which writes the text to object storage under a stable per-slug key and
  **replaces** the item's single `alphatex` media asset (`ScorePlayer` renders it on the detail page).
- **Asset safety:** the media-upload use-case **rejects SVG** (`UnsafeMediaTypeError` → 400) since SVG can
  embed scripts; raster images/audio/PDF/alphaTex are allowed.

## Flags

- `admin.block-editor` — swaps the Markdown textarea for the editor (articles, help, collections).
- `admin.block-editor-preview` — shows the side-by-side live iframe (articles).
- `admin.content-revisions` — autosave + the version-history panel.

All sit under the existing `admin.cms` + editor/admin RBAC gate (`guardAdmin`).

## Testing

- `packages/content-serde` — unit + the **golden corpus round-trip** (`apps/api/.../content-serde-corpus.test.ts`):
  every seeded article's `body_mdx` parses → serializes to HTML-equivalent markdown with embeds intact.
- API — adapter integration test (`drizzle-content-authoring.adapter.integration.test.ts`): details/embeds/
  tier/body_doc persist; partial updates preserve; overlay semantics.
- Web — `embed-fields` unit test; editor + preview are **live-verified in the browser** (TipTap/iframe
  islands don't unit-test cleanly under happy-dom, per the testing ADR).

## Gotchas

- The editor is `client:only="react"` (TipTap is browser-only) and mounts inside the single `ContentForm`
  island — React context (`editor-ui.ts`) propagates into TipTap node views because they render as portals
  in the same tree.
- After adding TipTap/serde deps, restart the Astro dev server (Vite dep re-optimize) — same `504` gotcha as
  alphatab/pixi.
- The preview iframe is same-origin (`sandbox="allow-scripts allow-same-origin"`); both sides verify
  `event.origin`.
