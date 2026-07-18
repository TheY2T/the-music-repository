---
name: add-adr
description: Author an Architecture Decision Record in docs/adr/ for The Music Repository — next sequential number, the accepted status/context/decision/consequences shape, and the docs index wiring. Use when recording a significant technical or architectural decision (a new library, a cross-cutting pattern, superseding an earlier choice).
---

# add-adr

ADRs are Definition of Done for any significant decision. One decision per file, immutable once accepted
(supersede with a new ADR rather than editing history).

## 1. Pick the number + filename

ADRs are `docs/adr/NNNN-kebab-title.md`, zero-padded, strictly sequential. Find the next number:
`ls docs/adr/ | tail -1` → increment. Filename = `NNNN-short-kebab-summary.md` (e.g.
`0034-redis-session-cache.md`).

## 2. Write the record

Match the house structure (see `docs/adr/0033-musickit-ui-common-ui-web-shell.md` as the exemplar):

```markdown
# ADR NNNN — <concise decision title>

- **Status:** accepted            # proposed | accepted | superseded by ADR XXXX
- **Date:** YYYY-MM               # today's month
- **Supersedes (in part):** ADR XXXX   # only if it revises an earlier decision

## Context
The forces at play — what problem, what constraints, what we want. No solution yet.

## Decision
What we chose, stated as active present tense ("We use X", "Ports are named for the capability").
Numbered points for multi-part decisions.

## Consequences
What becomes easier and what becomes harder. Include follow-on obligations (new gotchas, migrations).

## Alternatives considered
Each rejected option + the one-line reason it lost.
```

Keep it decision-focused and specific to *this* repo. If the decision changes a convention, the golden
rules, or introduces a gotcha, also update `CLAUDE.md` / the relevant `.claude/rules/*.md`.

## 3. Wire it up

- If the decision has user-facing surface, create/update its feature doc too (**`add-feature-doc`**).
- Update any Mermaid diagram in `docs/architecture/` the decision changes.
- The ADR list in `docs/README.md` points at the `adr/` directory (no per-file index to edit), but if you
  reference the ADR from a feature doc or CLAUDE.md, use its number.

## 4. Verify

`ls docs/adr/` shows the new file at the right sequence; no gap or duplicate number; links from
CLAUDE.md/rules/feature-docs resolve (`grep -rn "ADR NNNN" docs .claude`).
