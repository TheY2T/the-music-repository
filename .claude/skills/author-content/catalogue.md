# Authoring a catalogue article

Source: `apps/api/src/infrastructure/database/content/<slug>.md` →
`pnpm --filter @TheY2T/tmr-api content:build` → `seed-content.ts`. See `docs/features/catalogue.md` +
`docs/features/content-embeds.md` (ADR 0028).

## File shape

- **Frontmatter** — the catalogue metadata: title, instrument, summary, `details` facts
  (key/era/form/composer/level…), and curated `related` slugs. `details.era` is what the **Era**
  Meilisearch facet is derived from — there is **no SQL taxonomy table**.
- **Body** (`body_mdx`) — the rich prose lesson.
- **Embeds** — an optional fenced ` ```embeds ` block: a JSON array of `ContentEmbed` objects that render
  **preconfigured interactive tools** below the prose (stored in `details.embeds`). Spec-first
  (`ContentEmbed` is defined in TypeSpec); the build fails on bad JSON or an unknown tool.

## Embeds

To place a live, preconfigured tool (score / scale-boxes / keyboard / chord-diagrams / progression /
circle-of-fifths) under the lesson, use the **`embed-tool`** skill — it lists every embeddable tool and
its parameters. Each embeddable tool takes optional initial-state props (defaults = its `/tools` page).

## After building

`content:build` regenerates the build-safe `seed-content.ts` the seed consumes. Commit both the `.md` and
the regenerated bundle. Then seed + verify (see SKILL.md).
