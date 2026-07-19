import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import {
  type BackgroundStyle,
  DEFAULT_PREF,
  getBackgroundPref,
} from '@TheY2T/tmr-web-acl/dashboard-background';
import { useEffect, useState } from 'react';

/**
 * Decorative animated backdrop for the dashboard. Reads the user's saved style + intensity
 * (localStorage, via {@link getBackgroundPref}) on mount and picks the matching lazy Pixi scene.
 * Renders nothing during SSR / first client render and when the style is `none` or WebGL is absent.
 * Place inside a `relative` container with the dashboard content stacked above it. Changing the
 * preference elsewhere (settings, another tab) live-updates via the `storage`/custom events.
 * See docs/features/pixi-visualization.md.
 */

/** Lazy scene loaders per style. `none` has no scene. */
const LOADERS: Record<Exclude<BackgroundStyle, 'none'>, () => Promise<{ default: never }>> = {
  staff: () => import('@TheY2T/tmr-music-core/pixi/bg-staff-scene') as Promise<{ default: never }>,
  waves: () => import('@TheY2T/tmr-music-core/pixi/bg-waves-scene') as Promise<{ default: never }>,
  roll: () => import('@TheY2T/tmr-music-core/pixi/bg-roll-scene') as Promise<{ default: never }>,
  bokeh: () => import('@TheY2T/tmr-music-core/pixi/ambient-scene') as Promise<{ default: never }>,
};

export const BG_CHANGE_EVENT = 'tmr:dashboard-bg-change';

interface DashboardBackgroundProps {
  className?: string;
  /**
   * Controlled overrides — when set, these drive the canvas instead of the saved preference (used by
   * the settings live preview). Omit both to read the persisted preference (the dashboard usage).
   */
  style?: BackgroundStyle;
  intensity?: number;
}

export default function DashboardBackground({
  className,
  style,
  intensity,
}: DashboardBackgroundProps) {
  const controlled = style !== undefined;
  // SSR / first paint: render nothing (matches the hydration-safe fallback contract of PixiCanvas).
  const [pref, setPref] = useState(DEFAULT_PREF);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (controlled) {
      return;
    }
    setPref(getBackgroundPref());
    const sync = () => setPref(getBackgroundPref());
    window.addEventListener('storage', sync);
    window.addEventListener(BG_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(BG_CHANGE_EVENT, sync);
    };
  }, [controlled]);

  const activeStyle = controlled ? style : pref.style;
  const activeIntensity = controlled ? (intensity ?? DEFAULT_PREF.intensity) : pref.intensity;

  if (!mounted || activeStyle === 'none') {
    return null;
  }

  return (
    <PixiCanvas
      // Remount when the style changes — the scene loader is captured once per mount.
      key={activeStyle}
      decorative
      loader={LOADERS[activeStyle]}
      sceneProps={{ intensity: activeIntensity / 100 }}
      className={className}
      containerClassName="h-full w-full"
      fallback={<div aria-hidden className="size-full" />}
    />
  );
}
