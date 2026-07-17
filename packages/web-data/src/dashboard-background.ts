/**
 * Client-side preference for the animated dashboard background (a PixiJS decorative canvas rendered
 * behind the dashboard content). Two axes — the visual *style* and its *intensity* (0–100) — are
 * remembered in localStorage, mirroring the theme/instrument preference pattern (guarded for SSR and
 * private mode). The dashboard reads these on mount to pick a scene; the settings page writes them.
 * See docs/features/pixi-visualization.md.
 */

/** Selectable background styles. `none` disables the canvas entirely. */
export const BACKGROUND_STYLES = ['staff', 'waves', 'roll', 'bokeh', 'none'] as const;
export type BackgroundStyle = (typeof BACKGROUND_STYLES)[number];

export const DEFAULT_STYLE: BackgroundStyle = 'waves';
export const DEFAULT_INTENSITY = 55;

const STYLE_KEY = 'tmr.dashboardBg.style';
const INTENSITY_KEY = 'tmr.dashboardBg.intensity';

export interface BackgroundPref {
  style: BackgroundStyle;
  /** 0–100. */
  intensity: number;
}

export const DEFAULT_PREF: BackgroundPref = {
  style: DEFAULT_STYLE,
  intensity: DEFAULT_INTENSITY,
};

function isStyle(v: string | null): v is BackgroundStyle {
  return v !== null && (BACKGROUND_STYLES as readonly string[]).includes(v);
}

export function clampIntensity(n: number): number {
  if (Number.isNaN(n)) {
    return DEFAULT_INTENSITY;
  }
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** The remembered background preference, or defaults. Guarded (SSR / private mode). */
export function getBackgroundPref(): BackgroundPref {
  try {
    const style = localStorage.getItem(STYLE_KEY);
    const intensity = localStorage.getItem(INTENSITY_KEY);
    return {
      style: isStyle(style) ? style : DEFAULT_STYLE,
      intensity: intensity === null ? DEFAULT_INTENSITY : clampIntensity(Number(intensity)),
    };
  } catch {
    return { ...DEFAULT_PREF };
  }
}

/** Persist the background preference. */
export function setBackgroundPref(pref: BackgroundPref): void {
  try {
    localStorage.setItem(STYLE_KEY, pref.style);
    localStorage.setItem(INTENSITY_KEY, String(clampIntensity(pref.intensity)));
  } catch {
    /* ignore */
  }
}
