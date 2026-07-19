# ADR 0018 — UI component library: Atomic Design in `@TheY2T/tmr-ui` + `@TheY2T/tmr-design-tokens`

- **Status:** accepted — **superseded in part by ADR 0033** (organisms/templates/pages + music logic
  extracted into `@TheY2T/tmr-musickit-ui` / `@TheY2T/tmr-common-ui` / `@TheY2T/tmr-music-core` /
  `@TheY2T/tmr-web-acl`; the strict "library components are presentational, never fetch, i18n-by-prop"
  rule now applies only to `@TheY2T/tmr-ui` — the higher packages are "smart"). `@TheY2T/tmr-ui`
  (atoms + molecules) and `@TheY2T/tmr-design-tokens` remain exactly as decided here.
- **Date:** 2026-07
- **Context:** `apps/web` grew to ~76 React island files with only ONE shared UI primitive
  (`components/ui/button.tsx`). Everything else hand-rolled raw Tailwind, duplicating the same patterns
  (a `rounded-lg border` card panel in ~35 files, raw `<button>` in ~60, badges/pills in 11+, form
  label/input blocks in 5+, a page shell in ~70 pages). The design-token set was also incomplete
  (`--input`, `--destructive`, `--accent`, `--secondary`, `--popover` were referenced but never
  defined; status colors were raw `text-red-500`/`amber`/`green`). We want one documented, tokenized
  design system so future UI composes from shared parts instead of re-deriving them.

## Decision

1. **Two workspace packages, both shipped as raw ESM source (no build step).**
   - `@TheY2T/tmr-design-tokens` — CSS only: `tokens.css` (`:root`/`.dark` custom properties),
     `theme.css` (`@theme inline` mapping + `.dark` `@custom-variant`), `index.css` (both).
   - `@TheY2T/tmr-ui` — React atoms/molecules + shared music organisms + structural `.astro`.
   They follow the `@TheY2T/tmr-api-client` pattern (`main`/`types` → `./src/index.ts`, `exports` point
   at source), **NOT** the `contracts`/`flags` dual ESM+CJS tsup build. Rationale: these are **web-only**
   (Astro/Vite consumer, no NestJS/CJS consumer), Vite compiles TSX natively, and `.astro` files
   *cannot* be pre-compiled — so a source/JIT package is the only option that even works for `.astro`.
2. **Atomic Design as the vocabulary, not a rigid filesystem law.** `atoms` (shadcn primitives) →
   `molecules` (compositions) → `organisms` (sections). **Templates and pages stay in `apps/web`**
   (`BaseLayout.astro`, routes) — they carry app routing/i18n/auth and aren't reusable library units.
3. **shadcn primitives ARE the atoms** (`packages/ui/src/components/ui/*`). We do NOT wrap them in an
   extra `atoms/` layer. Molecules/organisms compose them. The package keeps a `components.json` so the
   shadcn CLI installs future primitives into the package (Tailwind v4 → `tailwind.config: ""`).
4. **Tailwind v4 tokens are shared as CSS**, not a JS preset (v4 removed presets). The app keeps ONE
   Tailwind entry (`global.css`) that does `@import "tailwindcss"` then
   `@import "@TheY2T/tmr-design-tokens/index.css"`, and adds `@source` globs pointing at the packages so
   utilities used *inside* library components are generated.
5. **Cross-package `.astro`** (`PageShell`, `Section`) requires `@TheY2T/tmr-ui` in
   `vite.ssr.noExternal` (astro.config.mjs) so Astro transforms rather than externalizes it. The export
   subpath is `"./astro/*": "./src/astro/*"` (no appended extension — the import already ends in `.astro`).
6. **i18n stays prop-driven (ADR 0017 holds).** Atoms/molecules are presentational — they take
   already-localized strings/`children` as props and never call `t()`. Organisms may take `locale` +
   call `t(locale, key)` exactly as before. `react`/`react-dom`/`astro` are **peerDependencies**.
7. **Storybook** (`@storybook/react-vite`, Tailwind v4 Vite plugin) is the component workbench, with a
   light/dark toolbar toggle mirroring the app's `.dark`-class strategy.

## Consequences

- One source of truth for chrome + tokens; new UI imports from `@TheY2T/tmr-ui`.
- The token set is completed + reconciled (added `input`/`destructive`/`accent`/`secondary`/`popover`
  + semantic `success`/`warning`/`info`), replacing raw status colors.
- `@source` globs are load-bearing: a wrong relative path silently drops the library's styles — the #1
  Tailwind-v4-monorepo footgun. Documented in `docs/features/design-system.md`.
- Shared music primitives (`StaffSequence`, `ChordDiagram` + `GUITAR_CHORDS`) live at
  `@TheY2T/tmr-ui/music`; audio/theory LOGIC (`src/lib/audio.ts`, `music-theory.ts`) stays in `apps/web`
  and is injected at the call site (e.g. `strumChord` in `src/lib/`… / `ChordDiagrams.tsx`).
  Single-use tool visuals (PianoKeyboard, GuitarFretboard) stay in the app — one usage ≠ a library unit.
- Storybook 9 currently warns about Vite 8 (Astro 7's Vite); tracked as a tooling caveat.

## Alternatives considered

- **Single `@TheY2T/tmr-ui` holding tokens too** — rejected: tokens are independently reusable and
  cleaner as a CSS-only package (they load in Storybook and any non-Tailwind context).
- **Compiled (tsup) UI package like `contracts`/`flags`** — unnecessary (no CJS/NestJS consumer) and
  impossible for `.astro`; adds a build step Vite doesn't need.
- **A separate `@TheY2T/tmr-music-ui`** — rejected for now; the shared music primitives are few, so a
  namespaced `@TheY2T/tmr-ui/music` subpath keeps the dependency graph simpler.
- **Re-wrapping shadcn primitives in a bespoke `atoms/` layer** — rejected: pure indirection/drift.
