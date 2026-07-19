# Feature: Iconography (Lucide)

- **Phase:** Platform · **Status:** shipped
- **Flag key:** none (foundational)
- **ADR:** [0019](../adr/0019-iconography-lucide.md) · related: [0018](../adr/0018-ui-component-library-atomic-design.md) (design system), [0017](../adr/0017-i18n-localization.md) (i18n)

## Purpose

A single, tokenized, theme-aware icon system so `apps/web` never uses raw emoji/unicode glyphs as
icons. Lucide is the source of truth on both surfaces (React islands + `.astro`).

## What to use where

| Surface | Import | Component |
|---|---|---|
| React islands + `@TheY2T/tmr-ui` components | `import { Icon } from '@TheY2T/tmr-ui'` | `<Icon name="lock" className="size-4" />` |
| Plain `.astro` files / templates | `import Icon from '@TheY2T/tmr-ui/astro/Icon.astro'` | `<Icon name="arrow-left" class="size-4" />` |

Both draw from Lucide (`lucide-react` / `@iconify-json/lucide`), so they render identically. The
`.astro` path emits **zero client JS** (inline SVG at build).

## Sizing, color, a11y

- **Size + color** via Tailwind on `className`/`class`: `size-4`, `text-muted-foreground`,
  `fill-current`. Lucide strokes use `currentColor`, so `text-*` utilities set the icon colour. Prefer `size-*` utilities
  over hardcoded pixel props.
- **Decorative (default):** omit `label` → the icon is `aria-hidden` + `focusable="false"`. Use this
  when the icon sits beside visible text or the interactive parent already has an accessible name.
- **Meaningful:** pass an already-localized `label` → `role="img"` + `aria-label`. Use for icon-only
  buttons/links. `label` is a translated string from the app's `t()` — **never** call `t()` in the
  library (ADR 0017).

```tsx
<Icon name="search" className="size-4 text-muted-foreground" />        {/* decorative */}
<button aria-label={t(locale, 'a11y.close')}><Icon name="x" className="size-4" /></button>
<Icon name="heart" className="size-5 fill-current text-red-500" />     {/* filled state */}
```

## Adding a new icon

Edit the registry in `packages/ui/src/components/ui/icon.tsx`: import the icon from `lucide-react` and
add a kebab-case entry. The `IconName` union updates automatically; only registered icons are bundled
(tree-shaking-safe). The `.astro` side needs nothing — `@iconify-json/lucide` already ships every
Lucide icon (use the same kebab name; it maps to `lucide:<name>`). Add it to the Storybook grid in
`atoms.stories.tsx`.

Current registry: `arrow-left`, `arrow-right`, `check`, `flame`, `heart`, `lock`, `music`,
`party-popper`, `piano`, `play`, `refresh`, `search`, `square`, `x`.

## i18n: no glyphs in strings

Do **not** embed arrows/checks/hearts/emoji in locale strings (`en.json`/`zh-Hans.json`). Keep the
string plain text and render an `<Icon>` beside it in the component. Example: back-link labels are
plain ("Tools", "首页"); `PageShell.astro` renders the leading `arrow-left`.

## NOT icons (leave as-is)

Semantic Western-music notation is not iconography and stays as unicode/SVG:
`♯ ♭ ♮ ♪ ♩ 𝅗𝅥` (accidentals/note values), hand-drawn SVG rests, `○`/`×` (guitar open-string markers),
`↓`/`↑`/`·` (strum-direction markers). Typographic arrows inside prose ("brightest → darkest") are
content, not icons.

## Wiring

- `pnpm-workspace.yaml` catalog: `lucide-react`, `astro-icon`, `@iconify-json/lucide`.
- `apps/web/astro.config.mjs`: `integrations: [react(), icon()]` +
  `vite.optimizeDeps.include: ['lucide-react']` (dev barrel-import guard).
- `packages/ui` depends on `lucide-react` + `astro-icon` (the `Icon.astro` wrapper).

## Gotchas

- **Astro components ≠ React components.** You cannot use `Icon.astro` / `astro-icon` inside a `.tsx`
  island, nor `lucide-react` in a plain `.astro`. Pick the wrapper for the surface.
- **Dev server:** after adding `astro-icon`/changing icon deps, restart `astro dev` or
  `rm -rf apps/web/node_modules/.vite` so Vite re-optimizes.
- Do **not** `import * as icons from 'lucide-react'` — it defeats tree-shaking. Extend the registry.

## Tests / verify

`pnpm --filter @TheY2T/tmr-ui check-types && lint`; `pnpm --filter @TheY2T/tmr-web check-types && lint`;
Storybook Icon grid (light + dark); drive `apps/web` in `/` and `/zh`. See the `add-ui-component` skill.
