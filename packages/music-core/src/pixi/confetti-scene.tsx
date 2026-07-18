/**
 * PixiJS confetti burst — a milestone celebration (session complete / personal best): coloured pieces
 * rain from the top and drift as they fall. Driven by a `fire` nonce so it can re-trigger. Purely
 * decorative; nothing under reduced motion. Loaded lazily by {@link PixiCanvas}. ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

export interface ConfettiSceneProps {
  /** Nonce — advance it to fire a fresh confetti fall. */
  fire: number;
}

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  sway: number;
  phase: number;
  life: number;
  color: number;
}

const noDraw = () => {};
const PIECES = 120;

function Confetti({ fire, reducedMotion }: ConfettiSceneProps & { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const parts = useRef<Piece[]>([]);
  const g = useRef<Graphics | null>(null);
  const lastFire = useRef(0);

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

  useEffect(() => {
    if (reducedMotion || size.w === 0 || fire === lastFire.current) {
      lastFire.current = fire;
      return;
    }
    lastFire.current = fire;
    const palette = [colors.accent, colors.success, colors.warning, colors.info, colors.primary];
    for (let i = 0; i < PIECES; i += 1) {
      parts.current.push({
        x: Math.random() * size.w,
        y: -20 - Math.random() * size.h * 0.4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 2 + Math.random() * 3,
        w: 4 + Math.random() * 5,
        h: 6 + Math.random() * 6,
        sway: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        life: 1,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
  }, [fire, reducedMotion, size, colors]);

  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        const gr = g.current;
        if (!gr) {
          return;
        }
        const dt = ticker.deltaTime;
        gr.clear();
        const live: Piece[] = [];
        for (const p of parts.current) {
          p.phase += 0.1 * dt;
          p.x += (p.vx + Math.sin(p.phase) * p.sway) * dt;
          p.y += p.vy * dt;
          // Fade out over the lower fifth of the screen.
          if (p.y > size.h * 0.8) {
            p.life -= dt / 30;
          }
          if (p.life > 0 && p.y < size.h + 20) {
            gr.rect(p.x, p.y, p.w, p.h).fill({ color: p.color, alpha: Math.max(p.life, 0) });
            live.push(p);
          }
        }
        parts.current = live;
      },
      [size],
    ),
  );

  if (!isInitialised || size.w === 0) {
    return null;
  }
  return <pixiGraphics ref={g} draw={noDraw} />;
}

export default function ConfettiScene({
  resizeTo,
  reducedMotion,
  resolution,
  ...scene
}: ConfettiSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Confetti {...scene} reducedMotion={reducedMotion} />
    </Application>
  );
}
