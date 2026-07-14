/**
 * PixiJS cover-art sparkle — a sparse layer of slow, twinkling motes drifting over a single
 * prominent CoverArt (e.g. the catalogue detail hero). Seeded from the cover's `seed` so the drift
 * varies per item. Purely decorative; static under reduced motion. Intended for ONE instance at a
 * time (per-card WebGL contexts would exceed the browser limit) — see {@link AnimatedCoverArt} and
 * ADR 0022. Loaded lazily by {@link PixiCanvas}.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from '@/components/PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

export interface CoverSparkleSceneProps {
  seed: string;
}

const COUNT = 22;
const noDraw = () => {};

/** FNV-1a → uint32, matching CoverArt's seed hashing so drift correlates with the artwork. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

interface Mote {
  x: number;
  y: number;
  vy: number;
  twPhase: number;
  twRate: number;
  r: number;
  baseAlpha: number;
}

function Sparkle({ seed, reducedMotion }: CoverSparkleSceneProps & { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const g = useRef<Graphics | null>(null);
  const motes = useRef<Mote[]>([]);

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

  useMemo(() => {
    if (size.w === 0) {
      return;
    }
    let s = hashSeed(seed);
    const rnd = () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    motes.current = Array.from({ length: COUNT }, () => ({
      x: rnd() * size.w,
      y: rnd() * size.h,
      vy: 0.08 + rnd() * 0.25,
      twPhase: rnd() * Math.PI * 2,
      twRate: 0.02 + rnd() * 0.04,
      r: 0.8 + rnd() * 2,
      baseAlpha: 0.15 + rnd() * 0.3,
    }));
  }, [size, seed]);

  const redraw = useCallback(() => {
    const gr = g.current;
    if (!gr) {
      return;
    }
    gr.clear();
    for (const m of motes.current) {
      const alpha = m.baseAlpha * (0.5 + 0.5 * Math.sin(m.twPhase));
      gr.circle(m.x, m.y, m.r).fill({ color: colors.accent, alpha });
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
          m.twPhase += m.twRate * ticker.deltaTime;
          if (m.y < -3) {
            m.y = size.h + 3;
          }
        }
        redraw();
      },
      [reducedMotion, size, redraw],
    ),
  );

  useEffect(() => {
    redraw();
  }, [redraw]);

  if (!isInitialised || size.w === 0) {
    return null;
  }
  return <pixiGraphics ref={g} draw={noDraw} />;
}

export default function CoverSparkleScene({
  resizeTo,
  reducedMotion,
  resolution,
  ...scene
}: CoverSparkleSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Sparkle {...scene} reducedMotion={reducedMotion} />
    </Application>
  );
}
