/**
 * Theme-token → alphaTab notation-color bridge (ADR 0027).
 *
 * alphaTab draws its own SVG glyphs, so — like the Pixi layer — their colors CANNOT be set with
 * `var(--token)`; they come from `display.resources` (a `RenderingResources` patch applied via
 * `settings` + `api.render()`). This hook reads the site's semantic design tokens (which change per
 * aesthetic × light/dark, ADR 0021) out of the live CSS as `#rrggbb` strings and returns the
 * `resources` patch, re-emitting whenever `ThemeSwitcher` flips `data-theme`/`.dark` on `<html>`.
 *
 * Overlay chrome (the playback cursor + A–B selection) is plain DOM and IS themed with CSS — see the
 * `.at-cursor-bar` / `.at-cursor-beat` / `.at-selection` rules in the player, not here.
 *
 * Deliberately alphaTab-free (no `@coderline/alphatab` import) so it stays cheap under happy-dom and
 * never drags the engine bundle into non-score code. Mirrors `lib/pixi/use-theme-colors.ts`.
 */
import { useEffect, useState } from 'react';

/** alphaTab notation colors we drive from tokens, as `#rrggbb` strings (a `RenderingResourcesJson`). */
export interface AlphaTabResources {
  mainGlyphColor: string;
  secondaryGlyphColor: string;
  staffLineColor: string;
  barSeparatorColor: string;
  barNumberColor: string;
  scoreInfoColor: string;
}

/** Which token backs each notation color. Glyphs follow `--foreground` so they invert in dark mode. */
const TOKEN_VARS: Record<keyof AlphaTabResources, string> = {
  mainGlyphColor: '--foreground',
  secondaryGlyphColor: '--muted-foreground',
  staffLineColor: '--border',
  barSeparatorColor: '--border',
  barNumberColor: '--muted-foreground',
  scoreInfoColor: '--muted-foreground',
};

/** Readable greyscale used during SSR / when a token can't be resolved (dark-leaning, like Pixi's). */
const FALLBACK: AlphaTabResources = {
  mainGlyphColor: '#ede6d6',
  secondaryGlyphColor: '#b0a68e',
  staffLineColor: '#362d20',
  barSeparatorColor: '#362d20',
  barNumberColor: '#b0a68e',
  scoreInfoColor: '#b0a68e',
};

let probe: HTMLDivElement | null = null;

function getProbe(): HTMLDivElement {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);
  }
  return probe;
}

/** Serialize a CSS color expression to `#rrggbb` via the browser (handles hex / rgb / oklch / var). */
function resolveHex(el: HTMLElement, cssValue: string): string | null {
  el.style.color = '';
  el.style.color = cssValue;
  const match = getComputedStyle(el).color.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b] = match[1].split(',').map((n) => Number.parseFloat(n.trim()));
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  const hex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Read every notation color from the live CSS. Falls back per-token; returns FALLBACK during SSR. */
export function readAlphaTabResources(): AlphaTabResources {
  if (typeof document === 'undefined' || !document.body) return { ...FALLBACK };
  const el = getProbe();
  const out = {} as AlphaTabResources;
  for (const key of Object.keys(TOKEN_VARS) as (keyof AlphaTabResources)[]) {
    out[key] = resolveHex(el, `var(${TOKEN_VARS[key]})`) ?? FALLBACK[key];
  }
  return out;
}

/**
 * React hook: the current notation `resources` patch, re-read live when the aesthetic (`data-theme`)
 * or mode (`.dark`) changes. `key` is a stable string that changes only when the colors change — use
 * it as an effect dependency to re-apply + re-render alphaTab exactly once per theme switch.
 */
export function useAlphaTabTheme(): { resources: AlphaTabResources; key: string } {
  const [resources, setResources] = useState<AlphaTabResources>(readAlphaTabResources);

  useEffect(() => {
    setResources(readAlphaTabResources());
    const observer = new MutationObserver(() => setResources(readAlphaTabResources()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    return () => observer.disconnect();
  }, []);

  return { resources, key: Object.values(resources).join('|') };
}
