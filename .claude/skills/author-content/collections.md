# Authoring a collection (course / learning path)

Source: `apps/api/content/collections/<slug>.md` →
`pnpm --filter @TheY2T/tmr-api collections:build` → `seed-collections.ts`. Backend in
`apps/api/src/collections/` (ADR 0023). See `docs/features/collections.md`.

## File shape

- **Frontmatter** — rich collection metadata (title, curator, cover, kind/level/instrument/era, featured…).
- `## Outcomes` — what the learner will be able to do.
- `## Section: <title>` blocks — each grouping ordered items as:
  `- <content-slug> (note: <curator note>; skills: [<focus skills>])`
  Items may also be ungrouped (before the first `## Section:`).

## Invariants (do not break)

- `Collection.itemSlugs` MUST stay a **flattened, section-ordered list** — the progress module reads it to
  compute completion. The build derives it from section order; don't reorder items in a way that desyncs it.
- A collection is stored as metadata + `collection_sections` + `collection_items` (own uuid PK, `section_id`,
  `curator_note`, `focus_skills`).
- Private user-created collections are **never** indexed in Meilisearch; ownership is enforced in the
  use-cases (403), not the route path.

## After building

`collections:build` regenerates `seed-collections.ts` (commit both files); seed reindexes the Meili
`collections` index. Verify the collection browses, sections render, and per-item notes show (see SKILL.md).
