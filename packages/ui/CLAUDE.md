# CLAUDE.md — @TheY2T/tmr-ui

The design-system foundation (ADR 0018): atoms (shadcn primitives) + molecules. Raw-source ESM. See root
`CLAUDE.md` and `.claude/rules/design-system.md`.

## The one hard rule: strictly presentational

- **Never fetches, never calls `t()`** — i18n-by-prop (localized strings come in as props). This is what
  separates `tmr-ui` from the smart packages (`musickit-ui`/`common-ui`, which MAY fetch + translate).
- Lowest UI layer: `design-tokens → **ui** → music-core → …`. Depends only on `@TheY2T/tmr-design-tokens`
  (+ shadcn primitive deps). Add a new dependency only if truly presentational.

## Atomic Design

- **Atoms** — shadcn primitives in `src/components/ui/*.tsx` (Button, Input, Dialog, …) + the **`Icon`
  atom** (`components/ui/icon.tsx` — Lucide; add an icon by extending the registry there).
- **Molecules** — `Field`, `Card`, `Badge`, `SearchField`, `CardGrid`, `StatCard`, `PageHeader`,
  `SegmentedToggle`, `StarRating`, … composed from atoms.
- Astro wrappers in `src/astro/*` (`Icon.astro`, `PageShell.astro`). Exports: `.`, `./lib/utils` (`cn`),
  `./components/ui/*`, `./astro/*`.

## Style with tokens, not colours

Compose from **semantic token utilities only** (`bg-primary`, `text-muted-foreground`, `border-border`,
`font-display`) so components re-theme across the 3 aesthetics × light/dark. Hardcoded palette colours
(`bg-amber-500`, hex) don't re-theme. No emoji/glyphs — use the `Icon` atom.

## Adding / extending components

Follow the **`add-ui-component`** skill: add the component + a co-located Storybook story (aggregated by
the central `@TheY2T/tmr-storybook` host, port 6006). Simple components unit-test here (happy-dom +
jest-dom) — pass any strings as props.
