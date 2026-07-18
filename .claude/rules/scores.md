---
paths:
  - "**/score/**"
  - "**/*ScorePlayer*"
  - "**/*alphatab*"
  - "apps/api/content/scores/**"
---

# Scores — alphaTab is the SINGLE engine (ADR 0027, replaced Verovio)

`ScorePlayer` (`packages/music-core`, flag `learning.interactive-scores`) is the one score component, over
a slim `ScoreEngine` interface with just `AlphaTabScoreEngine` (`@coderline/alphatab`, cataloged + pinned
EXACT, lazy dynamic-import). `resolveDisplayMode(instruments)` picks **`standard`** (piano — standard
notation + media-player bar) or **`tab`** (guitar — notation + tablature); **both modes use the same
shell-owned interaction** (`enableUserInteraction:false`, native selection off) so controls stay in sync.
Takes `url` (catalogue) OR `tex` (inline playground). Flag off = basic play/tempo. Authoring: **`add-score`**
skill + `docs/features/scores.md`.

## Gotchas that look like bugs but aren't

- **"Blank score" is usually lazy-render, not a bug.** alphaTab uses `ScrollMode.Continuous`, so an
  off-screen score has **0 `<svg>`** until scrolled into view. Also keep `await fetch` OUT of the
  engine-load effect (split fetch→state / load-sync) or the container detaches mid-load.
- **`PlayerState` comparison uses the numeric literal `1`** — `at.synth.PlayerState` is undefined in the
  browser build.
- The right-click loop menu needs **`z-index > 1000`** — alphaTab's `.at-cursors` overlay is `z-index:1000`.
- **Theme:** notation glyph colours aren't CSS-reactive — `use-alphatab-theme.ts` reads tokens as **hex**
  → `display.resources` + re-render on theme change. Cursor/selection overlays are DOM (`.at-cursor-*`).
- **Assets self-hosted, no CDN** — the `@coderline/alphatab-vite` plugin (in `astro.config.mjs`) copies
  Bravura → `/font` + soundfont → `/soundfont/sonivox.sf2`. alphaTab is client-only (Worker+AudioWorklet),
  always `api.destroy()` on unmount, and **NOT** in `optimizeDeps`.
- After `pnpm add`-ing a browser lib, **restart Astro dev** (or `rm -rf apps/web/node_modules/.vite`) or
  islands fail to hydrate (`504 Outdated Optimize Dep` / `_jsxDEV is not a function`).

## Authoring (apps/api)

`content/scores/<slug>.alphatex` + `<slug>.meta.json` (`ScoreMeta` provenance/licensing) →
`pnpm --filter @TheY2T/tmr-api scores:build` → committed `seed-scores.ts`. `scores:validate` re-parses
every `.alphatex` **and** every inline `score` embed `tex`. **Licensing:** ship only CC0 (OpenScore) or
hand-authored — never MuseScore uploads, unlicensed CCARH kern, or ODbL/anti-LLM ABC. Full matrix in
`docs/features/scores.md`.
