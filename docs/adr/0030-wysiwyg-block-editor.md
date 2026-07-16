# ADR 0030 — WYSIWYG block editor & DB-first content authoring

- **Status:** accepted; **Phases 1–4 shipped** (write-path completeness + `body_doc` storage; the
  `@TheY2T/tmr-content-serde` doc↔mdx package with a golden round-trip suite over the whole corpus; the
  TipTap block-editor island behind `admin.block-editor`, with the 11 tools as configurable node views;
  and the live iframe preview behind `admin.block-editor-preview` — all browser-verified end-to-end:
  create → persist → reload re-renders the embed, and typing updates the themed preview iframe live).
  Phases 5–7 (revisions/autosave, scores/collections/help editors, cross-cutting) are planned — see
  `~/.claude/plans/groovy-foraging-pizza.md`.
- **Date:** 2026-07-16
- **Builds on:** ADR 0028 (content embeds), ADR 0013 (RBAC), ADR 0018 (design system), ADR 0021 (themes),
  ADR 0027 (alphaTab scores), ADR 0006 (spec-first APIs).

## Context

Content had **two disjoint authoring paths**. The **file pipeline**
(`content/*.md` → `content:build` → `seed`) could author everything — `body_mdx`, the `details` JSONB
facts, curated `related`, interactive `embeds` (ADR 0028), scores, collections, help — but required
editing files, building, committing, and re-seeding, with no live publish. The **admin CMS**
(`apps/web/src/pages/admin/` + `apps/api/src/authoring/`) was live and RBAC-gated but a **strict
subset**: its write DTO (`ContentWriteInput`) and Drizzle adapter **silently dropped `details`,
`embeds`, `tier`, and scores**, and its body editor was a plain Markdown textarea.

The richest, highest-value parts of a catalogue article therefore could **not** be authored through the
UI — only by a developer editing files. The goal: a live WYSIWYG block editor in the admin area that
becomes the single authoring surface for all content, composed from the existing `@TheY2T/tmr-ui`
design system and the real interactive tool islands, with full-fidelity preview.

## Decision

- **Scope:** all content — articles, collections, scores (alphaTex), help topics.
- **Source of truth:** DB-first. The editor writes to the DB via the authoring API; publish reindexes
  Meilisearch and pages render immediately (they already read at runtime via React Query). The file
  pipeline is retired to a one-time importer + optional export/backup.
- **Editor engine:** **TipTap** (ProseMirror) — headless, styled from `@TheY2T/tmr-ui` + design tokens,
  with the 11 embed tools as node views rendering the real tool components. Chosen over Lexical/Plate/
  Editor.js/BlockNote for its mature interactive React node views, strict schema, small bundle, and
  per-node markdown serialization (the round-trip seam we need).
- **Live preview:** an authenticated Astro draft route in an **iframe**, synced via debounced
  `postMessage`, so the author sees the real components + theme.

### Storage: canonical `body_doc` + derived render fields

The public render path (`ContentDetail.tsx` → `marked.parse(bodyMdx)` → `ContentBody.tsx`) splits the
rendered HTML on `<div data-tmr-embed="N"></div>` markers and interleaves prose with `EmbedCard`s.
Markdown is **lossy** for round-tripping structured editor state.

So the TipTap ProseMirror JSON is stored in a new **canonical `body_doc jsonb` column**, and `body_mdx`
(with embed markers) + `details.embeds` are **derived** from it on save. `body_doc` is editor-only and
**never read by the public render path** — so the existing articles and the interleaving logic are
untouched and at zero risk. Legacy content without `body_doc` opens via a best-effort MDX→doc importer
once, then dual-write takes over.

The core treats `body_doc` as **opaque** (`ProseMirrorDoc = Record<string, unknown>`): persisted and
returned verbatim, never interpreted server-side, so the domain carries no ProseMirror dependency
(hexagonal purity).

## Phase 1 (shipped)

Completed the write path so the API + existing CMS persist what they used to drop:

- **Schema:** additive nullable `body_doc jsonb` on `content_items` (migration `0020`); `ContentItem`
  gains an opaque `bodyDoc`.
- **Contract (spec-first):** `ContentWriteInput` gains `tier`, `details`, `related`, `embeds`, `bodyDoc`;
  regenerated Zod DTOs + client.
- **Adapter:** `DrizzleContentAuthoring.create/update` now persist `tier` + `bodyDoc` and fold
  `details` + `related` + `embeds` into the single `details` JSONB. **Partial-write safety:** on update,
  `details`/`tier`/`bodyDoc` are written only when the payload carries them, so a client that omits a
  field preserves the stored value rather than clearing it (the adapter is the single place the
  top-level `embeds`/`related` write fields map into `details`).
- **Web (interim):** `ContentForm` gains a `tier` field. Full facts/embeds editing is deferred to the
  Phase 3 editor, which reads `body_doc` losslessly and surfaces `related`/`embeds` on the edit read path
  — sending partial `details` from the current form would risk dropping the CMS-hidden `related`.

## Consequences

- The write path is no longer a subset of the file pipeline for facts/embeds/tier — it just lacks the
  editing UI, which Phases 2–7 add.
- Two representations of the body coexist (`body_doc` canonical, `body_mdx`/`details.embeds` derived);
  the Phase-2 `@TheY2T/tmr-content-serde` package owns the conversion and a golden round-trip test suite
  guards byte-stability before the editor flag flips.
- Each subsequent phase ships behind its own flag (`admin.block-editor`, `…-preview`,
  `admin.content-revisions`, `admin.score-editor`, …), gated by the existing `guardAdmin` + RBAC.

## Verification

`pnpm --filter @TheY2T/tmr-api test:integration` covers the adapter round-trip
(`drizzle-content-authoring.adapter.integration.test.ts`): create persists details/related/embeds/tier/
bodyDoc; a partial update preserves them; a full update replaces them. `check-types` passes across the
workspace with the regenerated contract.
