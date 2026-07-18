/**
 * PixiJS drill-feedback burst — a brief particle celebration on a correct answer (accent/success
 * motes puffing outward) or a small muted-red scatter on a wrong one, for the ear-training tools.
 * Driven by a `pulse` nonce so each answer re-triggers it. Purely decorative; nothing under reduced
 * motion. Loaded lazily by {@link PixiCanvas}. See docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

export interface DrillPulse {
  n: number;
  /** `combo` is a bigger, gold celebratory burst fired at a combo milestone (Tier 2). */
  kind: 'correct' | 'wrong' | 'combo';
}
export interface DrillFeedbackSceneProps {
  pulse: DrillPulse | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color: number;
}

const noDraw = () => {};

function Burst({ pulse, reducedMotion }: DrillFeedbackSceneProps & { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const parts = useRef<Particle[]>([]);
  const g = useRef<Graphics | null>(null);
  const lastN = useRef(0);

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

  // Spawn a burst whenever the pulse nonce advances.
  useEffect(() => {
    if (!pulse || reducedMotion || size.w === 0 || pulse.n === lastN.current) {
      if (pulse) {
        lastN.current = pulse.n;
      }
      return;
    }
    lastN.current = pulse.n;
    const cx = size.w / 2;
    const cy = size.h * 0.4;
    const kind = pulse.kind;
    const positive = kind !== 'wrong';
    const count = kind === 'combo' ? 90 : kind === 'correct' ? 48 : 22;
    // Gold-leaning palette for a combo milestone; accent/success for a normal correct.
    const positivePalette =
      kind === 'combo'
        ? [colors.warning, colors.accent, colors.success]
        : [colors.accent, colors.success];
    for (let i = 0; i < count; i += 1) {
      const angle = positive
        ? Math.random() * Math.PI * 2
        : Math.PI / 2 + (Math.random() - 0.5) * 1.3; // wrong: downward scatter
      const speed =
        kind === 'combo'
          ? 4 + Math.random() * 8
          : kind === 'correct'
            ? 3 + Math.random() * 6
            : 1.5 + Math.random() * 2.5;
      const lift = kind === 'combo' ? 4 : kind === 'correct' ? 3 : 0;
      parts.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - lift,
        life: 1,
        max: (kind === 'combo' ? 0.9 : 0.7) + Math.random() * 0.5,
        r: (kind === 'combo' ? 2.5 : 2) + Math.random() * 3,
        color: positive
          ? positivePalette[Math.floor(Math.random() * positivePalette.length)]
          : colors.destructive,
      });
    }
  }, [pulse, reducedMotion, size, colors]);

  useTick(
    useCallback((ticker: { deltaTime: number }) => {
      const gr = g.current;
      if (!gr) {
        return;
      }
      const dt = ticker.deltaTime;
      gr.clear();
      const live: Particle[] = [];
      for (const p of parts.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.14 * dt; // gravity
        p.life -= dt / 60 / p.max;
        if (p.life > 0) {
          gr.circle(p.x, p.y, p.r).fill({ color: p.color, alpha: Math.max(p.life, 0) });
          live.push(p);
        }
      }
      parts.current = live;
    }, []),
  );

  if (!isInitialised || size.w === 0) {
    return null;
  }
  return <pixiGraphics ref={g} draw={noDraw} />;
}

export default function DrillFeedbackScene({
  resizeTo,
  reducedMotion,
  resolution,
  ...scene
}: DrillFeedbackSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Burst {...scene} reducedMotion={reducedMotion} />
    </Application>
  );
}
