# Feature: Design System (`@TheY2T/tmr-ui` + `@TheY2T/tmr-design-tokens`)

- **Phase:** Platform · **Status:** shipped
- **Flag key:** none (foundational; not feature-flagged)
- **ADR:** [0018](../adr/0018-ui-component-library-atomic-design.md) ·
  [0033](../adr/0033-musickit-ui-common-ui-web-shell.md) (web-as-shell extraction)

> **Update (ADR 0033):** the organism/template/page layer + music logic were extracted out of
> `apps/web` into four more raw-source packages, making the app a thin shell. Acyclic DAG:
> `tmr-design-tokens → tmr-ui → tmr-music-core → tmr-web-data → tmr-musickit-ui → tmr-common-ui → apps/web`.
> `@TheY2T/tmr-ui` stays the strictly-presentational atoms/molecules foundation described below;
> `tmr-musickit-ui` (music/learning UI + the `ChordDiagram`/`StaffSequence` organisms), `tmr-common-ui`
> (shell chrome + account/admin/billing/auth), `tmr-music-core` (theory/audio/pixi/score logic +
> chord-shape data), and `tmr-web-data` (api wrappers, auth client, nav, `Flags`/`User`/`Locale` types)
> are the new homes. The higher packages are "smart" (may fetch + call `t()` with `locale` by prop);
> only `tmr-ui` remains i18n-by-prop and fetch-free.

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

## Icons

Icons are Lucide, rendered through the **`Icon` atom** — never raw emoji/glyphs (ADR 0019 ·
[icons.md](./icons.md)). React: `import { Icon } from '@TheY2T/tmr-ui'` → `<Icon name="lock"
className="size-4" />`. `.astro`: `import Icon from '@TheY2T/tmr-ui/astro/Icon.astro'` (zero-JS inline
SVG via `astro-icon` + `@iconify-json/lucide`). Add an icon by extending the registry in
`packages/ui/src/components/ui/icon.tsx`. Decorative by default (`aria-hidden`); pass a localized
`label` for meaningful icons. Music-notation glyphs (`♯♭♮♪♩`) stay unicode.

## Tokens

`packages/design-tokens/src/tokens.css` defines `:root` + `.dark` variables; `theme.css` maps them to
Tailwind utilities via `@theme inline` and declares `@custom-variant dark`. The reconciled set adds
`--input`, `--destructive`, `--accent`, `--secondary`, `--popover` (+ `-foreground`) and semantic
`--success` / `--warning` / `--info`. `tokens.css` is pure CSS (no Tailwind directives) so it loads
anywhere.

## Theming — 3 aesthetics × light/dark (ADR 0021)

The site ships **three vintage aesthetics** — `hybrid` (default), `heritage`, `warm-minimal` — each
with a light and a dark ("after-hours") mode, selected by two independent hooks on `<html>`:
**aesthetic → `data-theme="…"`** (default `hybrid`, static in `BaseLayout` + restored pre-paint from
`localStorage['tmr.aesthetic']`) and **mode → the `.dark` class** (`localStorage['theme']`).
`tokens.css` holds six palette blocks (`[data-theme='X']` and `[data-theme='X'].dark`) plus per-aesthetic
**font tokens** (`--font-display/-body/-mono`) and **texture tokens** (`--paper-overlay`, `--frame-width`,
`--shadow-offset`, `--texture-grain`). Faces are self-hosted via `@fontsource` in
`design-tokens/src/fonts.css` (no external CDN). The grain wash is painted by a `body::before` overlay in
`apps/web`'s `global.css`. Switch via `apps/web/src/components/ThemeSwitcher.tsx` (in `SiteHeader`).
**Any new component MUST use semantic tokens only** (no hardcoded palette colors) or it won't re-theme;
music-notation SVG colors are the sole exception. Storybook's `preview.tsx` has Aesthetic + Mode toolbars.

## Wiring (already done in `apps/web`)

1. `src/styles/global.css`: `@import "tailwindcss";` → `@import "@TheY2T/tmr-design-tokens/index.css";`
   then `@source "../../../../packages/ui/src";` + `@source "../../../../packages/design-tokens/src";`.
2. `astro.config.mjs`: `vite: { ssr: { noExternal: ['@TheY2T/tmr-ui'] } }`.
3. `components.json`: `aliases.ui` → `@TheY2T/tmr-ui/components/ui`, `aliases.utils` →
   `@TheY2T/tmr-ui/lib/utils` (so `shadcn add` lands in the package).

## Storybook

A single central host, **`@TheY2T/tmr-storybook`** (ADR 0033), aggregates the co-located `*.stories.tsx`
from `tmr-ui`, `tmr-musickit-ui`, and `tmr-common-ui`. It surfaces components three ways:
- **Per-component stories** — one navigable entry per component (e.g. `MusicKit UI/PianoKeyboard`,
  `Common UI/Admin/Block Editor/BlockEditor`), auto-generated on `dev`/`build-storybook` by
  `scripts/gen-stories.mjs` into `src/generated` (gitignored + regenerated, like api-client's orval
  output — run `pnpm --filter @TheY2T/tmr-storybook gen` to refresh manually).
- **Curated stories** — hand-written co-located ones (e.g. the organism gallery in `musickit-ui`).
- **Two overview galleries** (`MusicKit UI/Gallery`, `Common UI/Gallery`) that render **every**
  component in an error-bounded grid.

Smart islands that need a live API/audio degrade to a graceful note (start the API with `pnpm dev`).
Run `pnpm --filter @TheY2T/tmr-storybook dev` (port 6006; also started by `pnpm dev` alongside api + web) /
`build-storybook`. **Aesthetic** + **Mode** toolbar toggles preview all 3 aesthetics × light/dark; a
Providers decorator supplies the api-client React-Query context.
Caveats: the alphaTab Vite plugin is omitted (it breaks Storybook's static build), so score components
render only in the app; Storybook 9 warns about Vite 8 (from Astro 7) — a peer-range warning.

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
