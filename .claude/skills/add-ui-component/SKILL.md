---
name: add-ui-component
description: Add or extend a UI component in the design system (@TheY2T/tmr-ui atoms/molecules/organisms) + design tokens, with a Storybook story. Use whenever building shared UI, adding a shadcn primitive, a reusable molecule, a shared music primitive, or a new design token. See docs/features/design-system.md + ADR 0018.
---

# add-ui-component

Shared UI lives in **`@TheY2T/tmr-ui`** (Atomic Design) and tokens in **`@TheY2T/tmr-design-tokens`**.
Never re-derive raw-Tailwind chrome in `apps/web` — compose from the library. Both packages are **raw
ESM source** (no build step): edit `src`, imports resolve immediately (restart `astro dev` only after
changing `exports`). ADR 0018.

## Decide the layer

- **Atom** — an irreducible primitive (button, input, badge). These are **shadcn primitives** in
  `packages/ui/src/components/ui/*`. Prefer the shadcn CLI (below); hand-author only for a primitive
  shadcn lacks. Do NOT wrap an existing shadcn primitive just to rename it.
- **Molecule** — a small composition of atoms (`Field`, `SearchField`, `CardGrid`, `Chip`,
  `StatCard`, `PageHeader`) → `packages/ui/src/components/molecules/*`.
- **Organism** — a larger reusable section. Domain-specific music primitives →
  `packages/ui/src/components/organisms/music/*` (exported from `@TheY2T/tmr-ui/music`).
- **NOT the library**: templates/pages (stay in `apps/web`: `BaseLayout.astro`, routes) and
  components used in exactly one place (app-specific — keep them in `apps/web/src/components`).

## 1. Add a shadcn atom (preferred for primitives)

From the package dir so the CLI uses its `components.json`:
```bash
cd packages/ui && pnpm dlx shadcn@latest add <primitive>   # e.g. dialog, tabs, tooltip
```
Tailwind v4 → `components.json` has `tailwind.config: ""`. Add any new Radix dep to the pnpm **catalog**
in `pnpm-workspace.yaml` and reference `catalog:`.

**Icons: use the `Icon` atom, never raw emoji/glyphs** (ADR 0019 · `docs/features/icons.md`). In React,
`import { Icon } from '@TheY2T/tmr-ui'` → `<Icon name="lock" className="size-4" />`; in `.astro`,
`import Icon from '@TheY2T/tmr-ui/astro/Icon.astro'`. To add an icon, import it from `lucide-react` and
add a kebab-case entry to the registry in `packages/ui/src/components/ui/icon.tsx` (typed `IconName`,
tree-shake-safe). Decorative by default (`aria-hidden`); pass a localized `label` for meaningful icons.
Size/color via Tailwind (`size-4`, `text-*`, `fill-current`). Do NOT hardcode emoji as icons in
`apps/web`; music-notation glyphs (`♯♭♮♪♩`) are the sole exception.

## 2. Hand-author a molecule/organism

Match the existing style (CVA for variants, `cn()` from `../../lib/utils`, tokens for color). Rules:
- **Presentational + i18n-by-prop.** Accept already-localized strings / `children` as props. NEVER call
  `t()` inside the library (ADR 0017). Organisms that need locale take `locale` as a prop.
- **Behavior via props** (dependency injection): e.g. audio-playing music primitives take an
  `onPlay`/`onStrum` callback — the app wires it to `src/lib/audio.ts`. Logic stays in the app.
- Use tokens only (`bg-primary`, `text-destructive`, `border-input`, …) — no raw hex/`text-red-500`.
- Islands rule holds: context-dependent pieces (Dialog/Tabs) compose inside ONE `.tsx` island root.

Then export it from the right barrel:
- atom/molecule → `packages/ui/src/index.ts`
- music organism → `packages/ui/src/components/organisms/music/index.ts`

## 3. Add a design token

Edit `packages/design-tokens/src/tokens.css` (both `:root` and `.dark`) and map it in `theme.css`
(`@theme inline { --color-<name>: var(--<name>); }`) so `bg-<name>`/`text-<name>` utilities generate.

## 4. Add a Storybook story

Co-locate `*.stories.tsx` next to the component; cover key variants in light + dark (use the Theme
toolbar). Run `pnpm --filter @TheY2T/tmr-ui storybook`.

## 5. Use it in `apps/web`

```tsx
import { Button, Card, Field, Input } from '@TheY2T/tmr-ui';
import { StaffSequence } from '@TheY2T/tmr-ui/music';
// pages: import PageShell from '@TheY2T/tmr-ui/astro/PageShell.astro';
```
User-facing text still goes through `t(locale, key)` in the **app** (see `add-translations`), passed
into the library component as props.

## 6. Verify

```bash
pnpm --filter @TheY2T/tmr-ui check-types && pnpm --filter @TheY2T/tmr-ui lint
pnpm --filter @TheY2T/tmr-web check-types
```
Then drive `apps/web` to confirm it renders in light/dark (see `/run`, `/verify`). If styles are
missing, check the `@source` globs in `apps/web/src/styles/global.css` (ADR 0018 / design-system doc).

## Write a test (Definition of Done — `add-tests` skill)

Alongside the Storybook story, add a component test (`packages/ui/src/**/*.test.tsx` for library
components, or `apps/web/src/components/<C>.test.tsx` for islands): render via `@testing-library/react`,
pass localized strings as **props** (components never call `t()`), and assert the presentational output
+ key a11y roles. happy-dom is the default env. Run `pnpm --filter @TheY2T/tmr-ui test` (or the web
filter). See `docs/features/testing.md`.
