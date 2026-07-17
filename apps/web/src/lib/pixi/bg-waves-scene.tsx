/**
 * PixiJS dashboard background — "sound-wave ribbons": a few overlapping sine ribbons that undulate
 * across the width like a slowed oscilloscope, tinted with theme tokens. Purely decorative; renders
 * a single static frame under reduced motion. Loaded lazily by {@link PixiCanvas}; never SSR'd.
 * `intensity` (0–1) scales opacity + amplitude. See docs/features/pixi-visualization.md, ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from '@/components/PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

const noDraw = () => {};
const STEP = 6; // px between sampled points along a ribbon

interface Ribbon {
  colorKey: 'accent' | 'primary' | 'mutedForeground';
  amp: number; // fraction of height
  freq: number; // waves across the width
  speed: number; // phase drift per tick
  yFrac: number; // vertical centre as fraction of height
  width: number;
  alpha: number;
}

const RIBBONS: Ribbon[] = [
  { colorKey: 'accent', amp: 0.1, freq: 1.4, speed: 0.02, yFrac: 0.42, width: 2, alpha: 0.5 },
  { colorKey: 'primary', amp: 0.14, freq: 1.0, speed: 0.014, yFrac: 0.55, width: 2.5, alpha: 0.4 },
  {
    colorKey: 'mutedForeground',
    amp: 0.08,
    freq: 2.1,
    speed: 0.026,
    yFrac: 0.6,
    width: 1.5,
    alpha: 0.35,
  },
];

function Ribbons({ reducedMotion, strength }: { reducedMotion: boolean; strength: number }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const g = useRef<Graphics | null>(null);
  const phase = useRef(0);

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

  const redraw = useCallback(() => {
    const graphics = g.current;
    if (!graphics || size.w === 0) {
      return;
    }
    graphics.clear();
    for (const r of RIBBONS) {
      const amp = r.amp * size.h * (0.4 + 0.6 * strength);
      const yMid = r.yFrac * size.h;
      for (let x = 0; x <= size.w; x += STEP) {
        const y =
          yMid + Math.sin((x / size.w) * r.freq * Math.PI * 2 + phase.current * r.speed) * amp;
        if (x === 0) {
          graphics.moveTo(x, y);
        } else {
          graphics.lineTo(x, y);
        }
      }
      graphics.stroke({ color: colors[r.colorKey], width: r.width, alpha: r.alpha * strength });
    }
  }, [colors, size, strength]);

  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        if (reducedMotion || size.w === 0) {
          return;
        }
        phase.current += ticker.deltaTime;
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

export default function BgWavesScene({
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
      <Ribbons reducedMotion={reducedMotion} strength={strength} />
    </Application>
  );
}
