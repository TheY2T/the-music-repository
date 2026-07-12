# Feature: Design System (`@TheY2T/tmr-ui` + `@TheY2T/tmr-design-tokens`)

- **Phase:** Platform · **Status:** shipped
- **Flag key:** none (foundational; not feature-flagged)
- **ADR:** [0018](../adr/0018-ui-component-library-atomic-design.md)

## Purpose

A single, documented, tokenized UI system so `apps/web` composes from shared parts instead of
re-deriving raw Tailwind chrome in every island. Organized by **Atomic Design** (atoms → molecules →
organisms; templates/pages stay in the app).

## Packages

| Package | What | Build |
|---|---|---|
| `@TheY2T/tmr-design-tokens` | CSS custom properties + Tailwind v4 `@theme` mapping + `.dark` variant | raw source (CSS only) |
| `@TheY2T/tmr-ui` | React atoms/molecules, shared music organisms, structural `.astro` + Storybook | raw ESM source (no build) |

Both are **raw source** (like `@TheY2T/tmr-api-client`), NOT dual ESM+CJS (like `contracts`/`flags`) —
they are web-only (Astro/Vite), and `.astro` cannot be precompiled. See ADR 0018.

## Layers & imports

```ts
// Atoms (shadcn primitives) + molecules — barrel:
import { Button, Card, Badge, Input, Textarea, Label, Select, Checkbox, Separator, Progress,
         Field, FormActions, SearchField, CardGrid, Chip, StatCard, EmptyState, SegmentedToggle,
         PageHeader, cn } from '@TheY2T/tmr-ui';
// Shared music organisms:
import { StaffSequence, ChordDiagram, GUITAR_CHORDS, type ChordShape } from '@TheY2T/tmr-ui/music';
// Structural Astro (pages only):
import PageShell from '@TheY2T/tmr-ui/astro/PageShell.astro';
```

- **Atoms** = shadcn primitives in `packages/ui/src/components/ui/*` (new-york, neutral, lucide). Do NOT
  re-wrap them. `Button` + `cn` are also re-exported from `apps/web/src/components/ui/button.tsx` and
  `apps/web/src/lib/utils.ts` for back-compat.
- **Molecules** = compositions (`Field`, `SearchField`, `CardGrid`, `Chip`, `StatCard`, `EmptyState`,
  `SegmentedToggle`, `PageHeader`, `FormActions`).
- **Music organisms** = `StaffSequence` (+ `ledgerSteps`) and `ChordDiagram`/`GUITAR_CHORDS`. Audio/
  theory LOGIC stays in `apps/web` (`src/lib/audio.ts`, `music-theory.ts`); `strumChord` (audio) lives
  in `apps/web/src/components/ChordDiagrams.tsx`. Single-use tool visuals (PianoKeyboard,
  GuitarFretboard) stay in the app.
- **Templates/pages** stay in `apps/web` (`BaseLayout.astro`, `src/pages/**`). `PageShell.astro` is the
  shared page container used INSIDE `BaseLayout`.

## Tokens

`packages/design-tokens/src/tokens.css` defines `:root` + `.dark` variables; `theme.css` maps them to
Tailwind utilities via `@theme inline` and declares `@custom-variant dark`. The reconciled set adds
`--input`, `--destructive`, `--accent`, `--secondary`, `--popover` (+ `-foreground`) and semantic
`--success` / `--warning` / `--info`. `tokens.css` is pure CSS (no Tailwind directives) so it loads
anywhere.

## Wiring (already done in `apps/web`)

1. `src/styles/global.css`: `@import "tailwindcss";` → `@import "@TheY2T/tmr-design-tokens/index.css";`
   then `@source "../../../../packages/ui/src";` + `@source "../../../../packages/design-tokens/src";`.
2. `astro.config.mjs`: `vite: { ssr: { noExternal: ['@TheY2T/tmr-ui'] } }`.
3. `components.json`: `aliases.ui` → `@TheY2T/tmr-ui/components/ui`, `aliases.utils` →
   `@TheY2T/tmr-ui/lib/utils` (so `shadcn add` lands in the package).

## Storybook

`pnpm --filter @TheY2T/tmr-ui storybook` (dev, port 6006) / `build-storybook`. Stories are co-located
(`*.stories.tsx`) under `packages/ui/src`. A **Theme** toolbar toggle previews light/dark.
Caveat: Storybook 9 warns about Vite 8 (from Astro 7) — a peer-range warning, not a build error.

## Gotchas

- **`@source` globs are load-bearing.** A wrong relative path from `global.css` to a package `src`
  silently drops the library's utility classes (the classic Tailwind-v4-monorepo bug). Verify styles
  render after any move.
- **Cross-package `.astro`** needs the package in `vite.ssr.noExternal`, and the export subpath is
  `"./astro/*": "./src/astro/*"` (no appended `.astro` — the import path already carries it).
- **i18n stays prop-driven.** Never call `t()` inside a library component — pass localized strings in.
- Restart `astro dev` (or `rm -rf apps/web/node_modules/.vite`) after changing the package's `exports`.

## How to add a component

Follow the **`add-ui-component`** skill.

## Tests

Typecheck: `pnpm --filter @TheY2T/tmr-ui check-types` + `pnpm --filter @TheY2T/tmr-web check-types`.
Lint: `pnpm --filter @TheY2T/tmr-ui lint`. Visual: Storybook + drive `apps/web` (see `/run`, `/verify`).
