---
name: add-feature-doc
description: Create or update a feature doc in docs/features/ for The Music Repository from the _template.md shape (purpose, UX, data model, API contract, help topics, tests) and wire it into the docs index. Use whenever shipping or changing a user-facing feature — docs are Definition of Done for every feature.
---

# add-feature-doc

Every feature gets `docs/features/<feature>.md`. It is the durable description of *what the feature does
and how to verify it* — distinct from an ADR (which records *why a decision was made*).

## 1. Create the file

`docs/features/<feature>.md`, kebab-case, matching an existing feature's name where possible. Copy
`docs/features/_template.md`:

```markdown
# Feature: <name>

- **Phase:** <n> · **Status:** planned | in-progress | shipped
- **Flag key:** `<domain>.<capability>` (from `@TheY2T/tmr-flags`)

## Purpose          # user need it serves and why
## UX behaviour     # key screens/interactions; note toggleable scaffolding
## Data model       # Drizzle tables/columns touched + taxonomy relationships
## API contract     # endpoints + the @TheY2T/tmr-contracts schemas involved
## Help topics      # Info View (help_topic) entries this feature registers
## Tests            # what's covered and how to run/verify end-to-end
```

## 2. Fill it accurately

- **Status/flag** must match reality — the flag key must exist in `@TheY2T/tmr-flags` + `flags/flags.json`
  (see **`manage-flags`**). Mark deferred features (flags OFF) clearly.
- **API contract** names the TypeSpec-generated `@TheY2T/tmr-contracts` schemas, not hand-written types.
- **Tests** section says how to run the end-to-end verification, not just "unit tests exist".
- Drop sections that don't apply (a client-only tool has no data model / API contract) rather than
  leaving them empty.

## 3. Wire it up

- `docs/README.md` points at the `features/` directory (no per-file index list to edit).
- Reference the doc from the code path it documents: the feature's `CLAUDE.md`/`.claude/rules/*.md`
  section should link `docs/features/<feature>.md`.
- Update `docs/architecture/` Mermaid diagrams if the feature changes the system/code architecture.
- If a significant decision drove the feature, pair it with an ADR (**`add-adr`**).

## 4. Verify

The doc exists, `Status`/`Flag key` are truthful, and every referenced path (endpoints, schemas, flag
key) resolves. `grep -rn "<feature>" docs/features` and the code confirm they agree.
