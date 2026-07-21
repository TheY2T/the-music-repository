---
paths:
  - "apps/api/content/**"
  - "apps/api/src/infrastructure/database/content/**"
---

# File-based content authoring

Catalogue articles, collections, and scores are authored as files → a `*:build` script regenerates a
committed, build-safe seed bundle → `db:seed` consumes it. Full workflow (with the vs-decision + per-type
detail) is the **`author-content`** skill; scores have their own **`add-score`** skill.

| Type | Source files | Build | Bundle |
|---|---|---|---|
| Catalogue | `src/infrastructure/database/content/<slug>.md` | `content:build` | `seed-content.ts` |
| Collections | `content/collections/<slug>.md` | `collections:build` | `seed-collections.ts` |
| Scores | `content/scores/<slug>.alphatex` + `.meta.json` | `scores:build` | `seed-scores.ts` |

Run builds with `pnpm --filter @TheY2T/tmr-api <script>`.

## Rules

- **Catalogue `.md`** = frontmatter + rich `body_mdx` + `details` JSONB (key/era/form/composer…) + curated
  `related` + a fenced ```embeds block (JSON array of `ContentEmbed` → preconfigured interactive tools
  below the prose). Era is a search facet derived from `details.era` — **no SQL taxonomy table**. The
  build fails on bad JSON / unknown tool. Embeds are spec-first (`ContentEmbed` in TypeSpec); follow the
  **`embed-tool`** skill (ADR 0028).
- **Collections `.md`** = frontmatter + `## Outcomes` + `## Section:` blocks with
  `- slug (note: …; skills: […])` items. `Collection.itemSlugs` MUST stay a **flattened, section-ordered**
  list — the progress module reads it (ADR 0023).
- **Licensing:** originally-hosted or public-domain only. See `docs/content/licensing.md` — scores ship
  only CC0/hand-authored.
