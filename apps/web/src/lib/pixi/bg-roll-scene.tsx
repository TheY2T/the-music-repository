/**
 * PixiJS dashboard background — "piano roll": soft, pill-shaped note-bars of light drift slowly
 * downward in vertical lanes, like a slowed-down piano roll. Distributed across the whole canvas
 * (not anchored to an edge), so it reads through the gaps between content cards. Purely decorative;
 * a static field under reduced motion. Lazily loaded by {@link PixiCanvas}; never SSR'd. `intensity`
 * (0–1) scales bar count + opacity. See docs/features/pixi-visualization.md, ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from '@/components/PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

const COLUMN_W = 46; // target px per lane
const BAR_COUNT = 30;
const noDraw = () => {};
const TINTS = ['accent', 'primary', 'mutedForeground'] as const;

interface Bar {
  x: number;
  w: number;
  y: number;
  len: number;
  vy: number;
  alpha: number;
  tint: (typeof TINTS)[number];
}

function seeded(i: number, salt: number): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function Roll({ reducedMotion, strength }: { reducedMotion: boolean; strength: number }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const g = useRef<Graphics | null>(null);
  const bars = useRef<Bar[]>([]);
  const count = Math.max(8, Math.round(BAR_COUNT * strength));

  useEffect(() => {
    if (!isInitialised || !app?.canvas) {
      return;
    }
    const read = () => setSize({ w: app.screen.width, h: app.screen.height });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(app.canvas);
    return () => observer.disconnect();
  }, [isInitialised, app]);

  // (Re)seed the bar field to the current size — bars sit in evenly-spaced lanes.
  useMemo(() => {
    if (size.w === 0) {
      return;
    }
    const lanes = Math.max(6, Math.round(size.w / COLUMN_W));
    const laneW = size.w / lanes;
    bars.current = Array.from({ length: count }, (_, i) => {
      const lane = Math.floor(seeded(i, 1) * lanes);
      return {
        x: lane * laneW + laneW * 0.2,
        w: laneW * 0.6,
        y: seeded(i, 2) * (size.h + 240) - 120,
        len: 34 + seeded(i, 3) * 130,
        vy: 0.25 + seeded(i, 4) * 0.6,
        alpha: (0.16 + seeded(i, 5) * 0.3) * (0.4 + 0.6 * strength),
        tint: TINTS[Math.floor(seeded(i, 6) * TINTS.length)],
      };
    });
  }, [size, count, strength]);

  const redraw = useCallback(() => {
    const graphics = g.current;
    if (!graphics || size.w === 0) {
      return;
    }
    graphics.clear();
    for (const b of bars.current) {
      graphics
        .roundRect(b.x, b.y, b.w, b.len, b.w / 2)
        .fill({ color: colors[b.tint], alpha: b.alpha });
    }
  }, [colors, size]);

  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        if (reducedMotion || size.h === 0) {
          return;
        }
        for (const b of bars.current) {
          b.y += b.vy * ticker.deltaTime;
          if (b.y > size.h + 8) {
            b.y = -b.len - seeded(b.x + b.len, b.vy) * 120;
          }
        }
        redraw();
      },
      [reducedMotion, size, redraw],
    ),
  );

  // Paint once when ready / on theme change (covers the reduced-motion static case too).
  useEffect(() => {
    redraw();
  }, [redraw]);

  if (!isInitialised || size.w === 0) {
    return null;
  }
  return <pixiGraphics ref={g} draw={noDraw} />;
}

export default function BgRollScene({
  resizeTo,
  reducedMotion,
  resolution,
  intensity = 1,
}: PixiSceneBaseProps & { intensity?: number }) {
  const strength = Math.max(0, Math.min(1, intensity));
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Roll reducedMotion={reducedMotion} strength={strength} />
    </Application>
  );
}
