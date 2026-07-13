# ADR 0021 — Multi-theme vintage design system (3 aesthetics × light/dark)

- **Status:** accepted
- **Date:** 2026-07
- **Context:** The design system from ADR 0018 tokenised the UI but shipped only the stock shadcn
  "hue-240 neutral" palette with **no brand identity, no font tokens, and no texture** — every screen
  read as an unstyled starter. The product is a *vintage music-scene* catalogue, so we want a warm,
  heritage aesthetic. Rather than commit to one look up front, the brief is to ship **three switchable
  vintage aesthetics** so the team can compare them live and choose later, each with a **light and a
  dark ("after-hours") mode** — six palettes in total. This must extend the existing
  `tokens.css` → `theme.css` → `global.css` pipeline (ADR 0018) without breaking the ~70 islands that
  already compose from `@TheY2T/tmr-ui`.

## Decision

1. **Two orthogonal selection hooks on `<html>`:**
   - **Aesthetic** → `data-theme="hybrid" | "heritage" | "warm-minimal"`. Default `hybrid`, set
     statically on `<html>` in `BaseLayout.astro` (so SSR/no-JS is correct) and overridden pre-paint
     from `localStorage['tmr.aesthetic']`.
   - **Mode** → the existing `.dark` class (unchanged shadcn mechanism), restored pre-paint from
     `localStorage['theme']`, falling back to the OS `prefers-color-scheme`.
   Combined selectors give the six palettes, e.g. `[data-theme="heritage"].dark`.

2. **Token file structure** (`packages/design-tokens/src/tokens.css`): `:root` holds only shared
   values (radius, texture defaults, light status colors); `.dark` holds shared dark status colors;
   then six blocks — `[data-theme="X"]` (light) and `[data-theme="X"].dark` (dark) — redefine the full
   shadcn semantic set (`--background/--foreground/--card/--primary/--secondary/--muted/--accent/
   --border/--input/--ring`). Because every real page carries a `data-theme`, aesthetic rules are
   plain attribute selectors (specificity 0,1,0) and the dark combinations are 0,2,0, so they always
   win over the shared `.dark` status block.

3. **The three aesthetics:**
   - **hybrid** (default) — heritage record-shop meets modern library: cream/ink/sepia + mustard;
     Fraunces / Source Sans 3.
   - **heritage** — antique sheet-music / playbill: oxblood + gold on antique cream, engraved 2px
     frames, stronger grain; Playfair Display / Libre Baskerville.
   - **warm-minimal** — restrained editorial: warm off-white + ink + a single sage accent, no
     texture; Newsreader / Inter.

4. **Font tokens per aesthetic.** `tokens.css` adds `--font-display`, `--font-body`, `--font-mono`;
   `theme.css` maps them into the `@theme inline` block so `font-display` / `font-body` / `font-mono`
   utilities exist and `font-sans` is remapped to the body face. Faces are **self-hosted via
   `@fontsource*`** (no external CDN — matches the CSP-clean posture) declared in a new
   `packages/design-tokens/src/fonts.css`, imported first from `index.css`. Font packages are pinned
   once in the **pnpm catalog** and depended on by `@TheY2T/tmr-design-tokens`.

5. **Texture tokens.** `--paper-overlay` (opacity), `--frame-width`, `--shadow-offset`, and a data-URI
   `--texture-grain` noise tile. `apps/web/src/styles/global.css` paints a fixed, `pointer-events:none`,
   `z-index:-1` `body::before` grain wash at `--paper-overlay` — so it is purely decorative, always
   under text (contrast preserved), and vanishes for warm-minimal (overlay 0).

6. **Switcher.** `apps/web/src/components/ThemeSwitcher.tsx` — a single island (popover state is local;
   React context can't cross islands) in the header. It mutates `data-theme` + `.dark` and persists to
   `localStorage`; i18n-by-prop (app island → may call `t(locale, key)`). Aesthetic labels/strings live
   in `@TheY2T/tmr-i18n-locales` (`theme.*` keys, en + zh-Hans).

7. **Storybook** previews across both axes: the `preview.tsx` decorator adds an **Aesthetic** toolbar
   (hybrid/heritage/warm-minimal) alongside the existing light/dark **Mode** toggle, stamping
   `data-theme` + `.dark` so every story renders in any of the six combinations.

## Consequences

- Because all chrome already reads semantic tokens, the six palettes propagate to every existing
  island with **zero per-component changes** — verified on the catalogue grid.
- New shared components MUST use semantic tokens only (no hardcoded palette colors) or they will not
  re-theme. Music-notation SVG colors (active-note highlighting) are exempt — they are notation, not
  chrome.
- Accessibility: WCAG 4.5:1 contrast must hold in **all six** combinations; this is a review gate.
- Font footprint: one variable file per family where available; non-variable faces load only the
  weights used. Revisit lazy-loading non-default aesthetics' fonts if payload grows.

## Alternatives considered

- **Single committed aesthetic** — rejected per the brief (the team wants to compare all three live).
- **A separate stylesheet per theme** — rejected; one token file with attribute-scoped blocks reuses
  the ADR 0018 pipeline and keeps the `@theme inline` mapping single-sourced.
- **CSS `light-dark()` / a `color-scheme` swap** — insufficient: we need three *aesthetics*, not just
  a light/dark pair, so an explicit `data-theme` dimension is required regardless.
