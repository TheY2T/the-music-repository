/**
 * Theme-token → Pixi-color bridge.
 *
 * PixiJS renders to WebGL and cannot use `var(--token)` the way our SVG components do — it needs
 * concrete numeric colors (`0xRRGGBB`). This module reads the site's semantic design tokens (which
 * change per aesthetic × light/dark, ADR 0021) out of the live CSS and hands Pixi scenes plain
 * integers, re-reading whenever `ThemeSwitcher` flips `data-theme`/`.dark` on `<html>`.
 *
 * It is deliberately **Pixi-free** (no `pixi.js` import) so it stays cheap to unit-test under
 * happy-dom and never drags the WebGL bundle into non-canvas code. See
 * docs/features/pixi-visualization.md.
 */
import { useEffect, useState } from 'react';

/** Semantic colors a Pixi scene draws with, as `0xRRGGBB` integers. */
export interface ThemeColors {
  background: number;
  foreground: number;
  card: number;
  cardForeground: number;
  primary: number;
  primaryForeground: number;
  secondary: number;
  secondaryForeground: number;
  muted: number;
  mutedForeground: number;
  accent: number;
  accentForeground: number;
  border: number;
  ring: number;
  destructive: number;
  success: number;
  warning: number;
  info: number;
}

/** Map of `ThemeColors` keys → the CSS custom property that backs each one. */
const TOKEN_VARS: Record<keyof ThemeColors, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  border: '--border',
  ring: '--ring',
  destructive: '--destructive',
  success: '--success',
  warning: '--warning',
  info: '--info',
};

/**
 * Neutral fallback used during SSR / when the DOM or a token is unavailable. Chosen so a canvas
 * degrades to a readable greyscale rather than throwing — real colors arrive on first client read.
 */
const FALLBACK: ThemeColors = {
  background: 0x1a1613,
  foreground: 0xede6d6,
  card: 0x1f1a14,
  cardForeground: 0xede6d6,
  primary: 0xd8ad4d,
  primaryForeground: 0x17130f,
  secondary: 0x2a2319,
  secondaryForeground: 0xede6d6,
  muted: 0x241e17,
  mutedForeground: 0xb0a68e,
  accent: 0xc79a3b,
  accentForeground: 0x17130f,
  border: 0x362d20,
  ring: 0xc79a3b,
  destructive: 0x9b3b2e,
  success: 0x4f7a48,
  warning: 0xb07d1f,
  info: 0x3e6b8c,
};

let probe: HTMLDivElement | null = null;

/** A hidden, DOM-attached element that inherits the current tokens so `var(--x)` resolves. */
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

/**
 * Parse a serialized CSS `rgb(...)`/`rgba(...)` string to a `0xRRGGBB` int, or null if it isn't one.
 * Exported for unit testing — this is the one piece of {@link resolveColor} that isn't DOM-bound.
 */
export function parseRgb(serialized: string): number | null {
  const match = serialized.match(/rgba?\(([^)]+)\)/);
  if (!match) {
    return null;
  }
  const [r, g, b] = match[1].split(',').map((n) => Number.parseFloat(n.trim()));
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return null;
  }
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

/**
 * Resolve one CSS color expression to `0xRRGGBB` via the browser. Setting `color` and reading it
 * back through `getComputedStyle` serializes any input (hex / `rgb()` / `oklch()` / a `var()`
 * chain) to `rgb(...)`, which we parse — robust to whatever format the tokens use.
 */
function resolveColor(el: HTMLElement, cssValue: string): number | null {
  el.style.color = '';
  el.style.color = cssValue;
  return parseRgb(getComputedStyle(el).color);
}

/**
 * Read every semantic token from the live CSS as `0xRRGGBB` ints. Falls back per-token so a single
 * missing variable can't blank the whole scene. Returns {@link FALLBACK} wholesale during SSR.
 */
export function readThemeColors(): ThemeColors {
  if (typeof document === 'undefined' || !document.body) {
    return { ...FALLBACK };
  }
  const el = getProbe();
  const out = {} as ThemeColors;
  for (const key of Object.keys(TOKEN_VARS) as (keyof ThemeColors)[]) {
    out[key] = resolveColor(el, `var(${TOKEN_VARS[key]})`) ?? FALLBACK[key];
  }
  return out;
}

/**
 * React hook: current theme colors as Pixi ints, re-read live when the aesthetic (`data-theme`) or
 * mode (`.dark`) changes on `<html>`. Use inside a Pixi scene to drive `fill`/`stroke` colors.
 */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(readThemeColors);

  useEffect(() => {
    // Re-read on the next frame too — the first paint may precede token application.
    setColors(readThemeColors());
    const observer = new MutationObserver(() => setColors(readThemeColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
