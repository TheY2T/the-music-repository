---
paths:
  - "packages/ui/**"
  - "packages/design-tokens/**"
  - "packages/musickit-ui/**"
  - "packages/common-ui/**"
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.astro"
---

# Design system (ADR 0018/0033, `docs/features/design-system.md`)

Build UI from the shared packages — no bespoke raw-Tailwind chrome in `apps/web`. Follow the
**`add-ui-component`** skill when adding/extending shared UI. Acyclic DAG:
`design-tokens → ui → music-core → web-acl → musickit-ui → common-ui → apps/web`.

- **`@TheY2T/tmr-ui`** — atoms (shadcn primitives) + molecules (`Field`, `Card`, `Badge`, `SearchField`,
  `CardGrid`, `StatCard`, `PageHeader`, `SegmentedToggle`, …). **Strictly presentational, i18n-by-prop
  (never calls `t()`), never fetches.**
- **`musickit-ui` / `common-ui`** are smart: they MAY use `web-acl` / `tmr-i18n` and call
  `t(locale, key)` — but take `locale`/`flags`/`user` **as props**; never reach for `Astro.locals`. They
  **never depend on `tmr-api-client`**: read data via the injected `useApiData()` port
  (`@TheY2T/tmr-web-acl/api-data`) and import DTO types from `@TheY2T/tmr-web-acl/dto` (ADR 0037).

## Theme with tokens, not colours (ADR 0021)

Site ships **3 aesthetics × light/dark** via `data-theme` (`hybrid`/`heritage`/`warm-minimal`) + the
`.dark` class on `<html>` (both set pre-paint in `BaseLayout`, switched by `ThemeSwitcher`). **Compose
from semantic token utilities ONLY** — `bg-background/bg-card/bg-primary/bg-muted/bg-accent`,
`text-foreground/text-muted-foreground`, `border-border`, `font-display/font-body`. **Hardcoded palette
colours (`bg-amber-500`, `text-red-500`, hex) do NOT re-theme** — music-notation SVG is the sole exception.

Tokens come from `@TheY2T/tmr-design-tokens` (imported by `global.css`, generated as Tailwind utilities).
`global.css` has `@source` globs pointing at the packages — **if styles vanish, check them** (a new
package must be added to `astro.config.mjs` `ssr.noExternal` + a `@source` glob).

## Icons (ADR 0019, `docs/features/icons.md`)

No raw emoji/glyphs. Use `<Icon name="lock" className="size-4" />` from `@TheY2T/tmr-ui` in React and
`@TheY2T/tmr-ui/astro/Icon.astro` in `.astro` (both Lucide; add via the registry in
`packages/ui/src/components/ui/icon.tsx`). Never bake glyphs into i18n strings. Music-notation glyphs
(`♯♭♮♪♩`), hand-drawn rests, and guitar `○`/`×` + strum `↓↑·` markers stay unicode — they are notation.

## Data tables & long lists — always paginate

Every `Table` and every unbounded list/grid (length grows with data) MUST paginate with the shared
standard — never render a full unbounded array. Use **`usePagination(items, { resetKey })`** +
**`PaginationBar`** from `@TheY2T/tmr-ui` (rows-per-page `Select` + "Showing X–Y of N" + numbered pager).
`DEFAULT_PAGE_SIZES` = `[10, 25, 50, 100, 200]` (default 10; `initialPageSize: 25` for card grids). Call
the hook **before any early return** (pass `items ?? []` while loading); render `pageItems`; pass labels
i18n-by-prop (`common.perPage`/`common.showing`/`common.prev`/`common.next`). `EntityManager`'s table view
and `AdminLocaleManager` are the reference. Follow the **`add-ui-component`** skill.

## Islands

One island root per interactive unit — context-dependent shadcn (Dialog/Select/Tabs/Toast) must be
composed inside a single `.tsx` (React context doesn't cross island boundaries). Hydrate minimally
(`client:load` only where immediately interactive; else `client:visible`/`idle`). Storybook host:
`@TheY2T/tmr-storybook` (port 6006).
