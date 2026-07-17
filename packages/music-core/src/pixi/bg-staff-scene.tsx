/**
 * PixiJS dashboard background — "floating staff & notes": faint five-line staves span the width
 * while stylized noteheads drift across and bob gently, as if a phrase is being read. Purely
 * decorative; static frame under reduced motion. Lazily loaded by {@link PixiCanvas}; never SSR'd.
 * `intensity` (0–1) scales note count + opacity. See docs/features/pixi-visualization.md, ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

const NOTE_COUNT = 18;
const noDraw = () => {};

// Two staves, positioned as fractions of the canvas height; each is 5 lines `gapFrac` apart.
const STAVES = [
  { topFrac: 0.28, gapFrac: 0.035 },
  { topFrac: 0.62, gapFrac: 0.035 },
];

interface Note {
  x: number;
  staff: number;
  line: number; // 0..8 (lines + spaces) within the staff
  vx: number;
  bob: number;
  phase: number;
  r: number;
  alpha: number;
  stemUp: boolean;
}

function seeded(i: number, salt: number): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function Sheet({ reducedMotion, strength }: { reducedMotion: boolean; strength: number }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const g = useRef<Graphics | null>(null);
  const notes = useRef<Note[]>([]);
  const count = Math.max(4, Math.round(NOTE_COUNT * strength));

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
    notes.current = Array.from({ length: count }, (_, i) => ({
      x: seeded(i, 1) * size.w,
      staff: seeded(i, 2) > 0.5 ? 1 : 0,
      line: Math.floor(seeded(i, 3) * 9),
      vx: 0.2 + seeded(i, 4) * 0.5,
      bob: 3 + seeded(i, 5) * 5,
      phase: seeded(i, 6) * Math.PI * 2,
      r: 4 + seeded(i, 7) * 3,
      alpha: (0.25 + seeded(i, 8) * 0.35) * (0.4 + 0.6 * strength),
      stemUp: seeded(i, 9) > 0.5,
    }));
  }, [size, count, strength]);

  const redraw = useCallback(() => {
    const graphics = g.current;
    if (!graphics || size.w === 0) {
      return;
    }
    graphics.clear();
    // Staff lines.
    const gap = STAVES[0].gapFrac * size.h;
    for (const s of STAVES) {
      const top = s.topFrac * size.h;
      for (let l = 0; l < 5; l++) {
        const y = top + l * gap;
        graphics.moveTo(0, y).lineTo(size.w, y);
      }
    }
    graphics.stroke({ color: colors.border, width: 1, alpha: 0.5 * (0.5 + 0.5 * strength) });
    // Noteheads (bobbing).
    for (const n of notes.current) {
      const top = STAVES[n.staff].topFrac * size.h;
      const y = top + (n.line / 2) * gap + Math.sin(n.phase) * n.bob;
      graphics.ellipse(n.x, y, n.r * 1.25, n.r).fill({ color: colors.accent, alpha: n.alpha });
      const stemX = n.stemUp ? n.x + n.r * 1.2 : n.x - n.r * 1.2;
      graphics
        .moveTo(stemX, y)
        .lineTo(stemX, y + (n.stemUp ? -gap * 3 : gap * 3))
        .stroke({ color: colors.accent, width: 1.5, alpha: n.alpha });
    }
  }, [colors, size, strength]);

  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        if (reducedMotion || size.w === 0) {
          return;
        }
        for (const n of notes.current) {
          n.x -= n.vx * ticker.deltaTime;
          n.phase += 0.02 * ticker.deltaTime;
          if (n.x < -12) {
            n.x = size.w + 12;
            n.line = Math.floor(seeded(n.phase * 1000, n.r) * 9);
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

export default function BgStaffScene({
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
      <Sheet reducedMotion={reducedMotion} strength={strength} />
    </Application>
  );
}
