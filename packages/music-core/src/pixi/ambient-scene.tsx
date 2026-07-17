/**
 * PixiJS ambient background — a slow drift of soft "dust" motes behind the home hero, tinted with
 * the theme accent/muted tokens for a vintage, lamplit feel. Purely decorative; paused (static
 * field) under reduced motion. Loaded lazily by {@link PixiCanvas}; never imported on the server.
 * See docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

const COUNT = 44;
const noDraw = () => {};

/** Optional strength (0–1) — scales mote count + opacity. Defaults to 1 (home-hero look). */
interface AmbientProps extends PixiSceneBaseProps {
  intensity?: number;
}

interface Mote {
  x: number;
  y: number;
  vy: number;
  drift: number;
  phase: number;
  r: number;
  alpha: number;
  warm: boolean;
}

// Deterministic-ish pseudo-random from an index (no Math.random dependency for the initial field).
function seeded(i: number, salt: number): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function Field({ reducedMotion, intensity = 1 }: { reducedMotion: boolean; intensity?: number }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const g = useRef<Graphics | null>(null);
  const motes = useRef<Mote[]>([]);
  const strength = Math.max(0, Math.min(1, intensity));
  const count = Math.max(6, Math.round(COUNT * strength));

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

  // (Re)seed the mote field to the current size.
  useMemo(() => {
    if (size.w === 0) {
      return;
    }
    motes.current = Array.from({ length: count }, (_, i) => ({
      x: seeded(i, 1) * size.w,
      y: seeded(i, 2) * size.h,
      vy: 0.15 + seeded(i, 3) * 0.35,
      drift: 6 + seeded(i, 4) * 14,
      phase: seeded(i, 5) * Math.PI * 2,
      r: 1 + seeded(i, 6) * 3,
      alpha: (0.12 + seeded(i, 7) * 0.28) * (0.4 + 0.6 * strength),
      warm: seeded(i, 8) > 0.5,
    }));
  }, [size, count, strength]);

  const redraw = useCallback(() => {
    const graphics = g.current;
    if (!graphics) {
      return;
    }
    graphics.clear();
    for (const m of motes.current) {
      const x = m.x + Math.sin(m.phase) * m.drift;
      graphics
        .circle(x, m.y, m.r)
        .fill({ color: m.warm ? colors.accent : colors.mutedForeground, alpha: m.alpha });
    }
  }, [colors]);

  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        if (reducedMotion || size.h === 0) {
          return;
        }
        for (const m of motes.current) {
          m.y -= m.vy * ticker.deltaTime;
          m.phase += 0.01 * ticker.deltaTime;
          if (m.y < -4) {
            m.y = size.h + 4;
            m.x = seeded(m.phase * 1000, m.r) * size.w;
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

export default function AmbientScene({
  resizeTo,
  reducedMotion,
  resolution,
  intensity,
}: AmbientProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Field reducedMotion={reducedMotion} intensity={intensity} />
    </Application>
  );
}
