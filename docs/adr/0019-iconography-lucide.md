# ADR 0019 — Iconography: Lucide via an `Icon` atom (React) + `astro-icon` (`.astro`)

- **Status:** accepted
- **Date:** 2026-07
- **Context:** `apps/web` used **hardcoded emoji and unicode glyphs as icons** — 🔒 (locked), 🎹 (MIDI),
  ✕ (close), ✓/✗ (quiz marks), 🔥 (streak), 🎉 (celebrate), ♥/♡ (favorite), `▶`/`■` (play/stop across
  ~37 tool components), `↻` (regenerate), and `←`/`→` navigation arrows (several baked into i18n
  locale strings). Glyphs render inconsistently across platforms/fonts, aren't theme-aware, can't be
  sized or colored with design tokens, and — when embedded in translation strings — pollute the i18n
  layer. `lucide-react` was already the configured `iconLibrary` (both `components.json`) and cataloged,
  but there was no shared icon primitive: icons were ad-hoc direct imports and most UI still used glyphs.

## Decision

1. **Lucide is the icon system.** React surfaces use `lucide-react`; `.astro` surfaces use `astro-icon`
   backed by `@iconify-json/lucide` (same Lucide geometry → pixel-identical across both). Both pinned
   via the pnpm catalog. There is **no single package that serves both** — `astro-icon`/`@lucide/astro`
   export Astro components (can't render inside a React island); `lucide-react` exports React components
   (can't render in a plain `.astro`). The split is intentional, not incidental.
2. **React: a curated `Icon` atom** at `packages/ui/src/components/ui/icon.tsx`, exported from the
   `@TheY2T/tmr-ui` barrel. It wraps a **direct-import registry** (`{ lock: Lock, play: Play, … }`) with
   a typed `IconName` union. Rationale: a name-based `import * as icons` / dynamic lookup defeats
   tree-shaking (pulls the whole ~1,500-icon library); a curated registry keeps the ergonomic
   `<Icon name="…" />` API **and** ships only registered icons. To add an icon: import it from
   `lucide-react` and add one kebab-case registry entry.
3. **`.astro`: a thin `Icon.astro`** (`packages/ui/src/astro/Icon.astro`) mirroring the same name-based
   API over `astro-icon`'s `<Icon name="lucide:…" />` — zero client JS (inline SVG at build). Used by
   `PageShell.astro` and page templates.
4. **Presentational + i18n-by-prop (ADR 0017 / 0018 hold).** The atom never calls `t()`. Decorative by
   default (`aria-hidden` + `focusable="false"`); pass an already-localized `label` prop to make an icon
   meaningful (`role="img"` + `aria-label`). Size/color via Tailwind on `className` (`size-4`,
   `text-muted-foreground`) — Lucide uses `currentColor`.
5. **Glyphs removed from i18n strings.** Arrows/checks/hearts/celebrate that were baked into
   `en.json`/`zh-Hans.json` are stripped from the strings; the icon is rendered beside the localized
   text in the consuming component (e.g. `PageShell` renders a leading `arrow-left` for any `back` link).
6. **Music-notation glyphs are OUT of scope.** Accidentals/note-values (`♯ ♭ ♮ ♪ ♩ 𝅗𝅥`), hand-drawn SVG
   rests, guitar-diagram open-string markers (`○`/`×`), and strum-direction markers (`↓`/`↑`/`·`) are
   semantic Western-music notation, not UI icons, and stay as unicode/SVG. Typographic arrows *inside
   prose* ("brightest → darkest", data-flow descriptions) are content, not icons, and also stay.
7. **Vite dev guard.** `apps/web/astro.config.mjs` adds `vite.optimizeDeps.include: ['lucide-react']`
   to pre-bundle the barrel, avoiding the dev-server per-icon request blowup.

## Consequences

- One sanctioned way to render an icon on each surface; no bespoke glyph chrome in `apps/web`.
- Icons are theme-aware and token-sized; the `Icon` atom is the single a11y-enforcing seam.
- Adding an icon is a one-line registry edit (React) — nothing to install; the Iconify set already
  ships every Lucide icon for the `.astro` side.
- Two icon packages to keep in step, but both are Lucide, so visual parity is automatic.

## Alternatives considered

- **Direct `lucide-react` imports everywhere** (no wrapper): idiomatic but loses the central a11y seam
  and the name-based API, and leaves `.astro` unaddressed. Rejected.
- **`import * as icons` dynamic `<Icon name>`**: nicest API but defeats tree-shaking. Rejected; the
  curated registry gives the same API without the bundle cost. (Lucide's `DynamicIcon` remains an
  escape hatch for genuinely runtime-driven names, should we ever need it.)
- **`@lucide/astro`** instead of `astro-icon`: drops the Iconify layer but is Lucide-only and less
  aligned with the name-based API; `astro-icon` mirrors the React `<Icon name>` ergonomics.
