---
name: author-content
description: Author file-based content for The Music Repository — catalogue articles, collections (courses/paths), or objective drill decks — through the source-file → build-script → seed pipeline. Use when adding or editing a catalogue lesson, a collection, or a drill deck. For sheet music use the add-score skill; for embedding a tool in an article see the embed-tool skill.
---

# author-content

Content is authored as **files**, built into a committed seed bundle, and loaded by the seed. Never edit a
generated `seed-*.ts` bundle by hand — edit the source file and rebuild.

## Which kind? (decide first)

| You are adding… | Read | Source dir | Build |
|---|---|---|---|
| A catalogue lesson/article | [catalogue.md](catalogue.md) | `apps/api/src/infrastructure/database/content/` | `content:build` |
| A course / learning path | [collections.md](collections.md) | `apps/api/content/collections/` | `collections:build` |
| An objective drill deck | [drills.md](drills.md) | `packages/music-core/src/drills/generators/` | (no build — code) |
| Sheet music | — use **`add-score`** | `apps/api/content/scores/` | `scores:build` |

## Common workflow (catalogue + collections)

1. Write the source file (see the per-type reference above for the exact frontmatter/section shape).
2. Build the bundle: `pnpm --filter @TheY2T/tmr-api <content:build|collections:build>`. The build **fails
   on bad input** (invalid JSON in an `embeds` block, unknown tool, malformed section) — fix and rerun.
3. Seed: `pnpm app:seed` (containerized) or `pnpm --filter @TheY2T/tmr-api db:seed` — this reindexes
   Meilisearch too.
4. Verify in the running app (**`run-local`**): the item appears in the catalogue/collection, facets are
   right, embeds render.

## Rules

- **Licensing:** originally-hosted or public-domain only — see `docs/content/licensing.md`. Cite the source.
- **Commit the rebuilt `seed-*.ts`** alongside the source file.
- Content is authored in **English**; per-locale **catalogue** translations (title/summary/body) are
  overlaid at read time from the DB `entity_translations` table via `?locale=` (ADR 0034 Phase 2, edited
  in the CMS — not in these source files). Taxonomy names + collections/help translations are not built
  yet. See `.claude/rules/i18n.md`.
