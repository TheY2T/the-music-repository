# Keeping code in sync

Mechanisms that prevent drift as the codebase grows across phases:

| Concern | Single source of truth | How |
|---|---|---|
| FE/BE types & API contracts | `@TheY2T/tmr-contracts` | Zod schemas + inferred types imported by both apps |
| Feature-flag keys & eval-context | `@TheY2T/tmr-flags` | one registry imported by api + web; `flags/flags.json` defines behaviour |
| Dependency versions | **pnpm catalogs** (`pnpm-workspace.yaml`) | add a version once; packages reference `catalog:` |
| File/naming casing | Biome `useFilenamingConvention` + CI | per-package rules; enforced in CI (case-insensitive FS traps) |
| Significant decisions | `docs/adr/` | one ADR per choice; supersede rather than edit history |
| Config (ts/biome/eslint) | `packages/config-*` | shared configs extended per package/app |

**When you add a feature:** update the contract (if the API surface changes), register any flag key,
add the doc, and — if a new repeatable pattern emerged — a `.claude/skills/` playbook. See the
`add-feature` skill.
