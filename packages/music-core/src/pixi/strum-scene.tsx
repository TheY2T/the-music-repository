/**
 * PixiJS strum/picking-pattern strip — the visual layer behind {@link StrumPattern}. Draws one bar of
 * beat cells (↓ down, ↑ up, · rest) and highlights the cell that is currently sounding. Purely
 * presentational: the island owns timing + audio and passes `cells` + `activeIndex`; the scene just
 * paints the row and moves the highlight. Re-tints with the theme via {@link useThemeColors}. Loaded
 * lazily by {@link PixiCanvas}; never runs on the server. See docs/features/pixi-visualization.md and
 * ADR 0029.
 */
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics, Text });

export interface StrumSceneProps {
  /** One bar of cells: `D` (down), `U` (up), or anything else = rest. */
  cells: string[];
  /** Index of the currently-sounding cell, or -1 when stopped. */
  activeIndex: number;
}

const glyph = (cell: string) => (cell === 'D' ? '↓' : cell === 'U' ? '↑' : '·');

function Strip({ cells, activeIndex }: StrumSceneProps) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!isInitialised || !app?.canvas) return;
    const read = () => setSize({ w: app.screen.width, h: app.screen.height });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(app.canvas);
    return () => observer.disconnect();
  }, [isInitialised, app]);

  const n = Math.max(1, cells.length);
  const pad = 10;
  const cellW = (size.w - pad * 2) / n;
  const cellH = Math.min(size.h - pad * 2, cellW * 1.4);
  const top = (size.h - cellH) / 2;
  const cellX = (i: number) => pad + i * cellW;

  const drawCells = useCallback(
    (g: Graphics) => {
      g.clear();
      for (let i = 0; i < n; i += 1) {
        const active = i === activeIndex;
        g.roundRect(cellX(i) + 2, top, cellW - 4, cellH, 8);
        g.fill({ color: active ? colors.accent : colors.card });
        g.roundRect(cellX(i) + 2, top, cellW - 4, cellH, 8);
        g.stroke({ color: active ? colors.ring : colors.border, width: active ? 2 : 1 });
      }
    },
    [n, activeIndex, cellW, cellH, top, colors],
  );

  if (size.w === 0) return null;
  return (
    <pixiContainer>
      <pixiGraphics draw={drawCells} />
      {cells.map((cell, i) => (
        <pixiText
          key={`c${i}`}
          text={glyph(cell)}
          anchor={0.5}
          x={cellX(i) + cellW / 2}
          y={top + cellH / 2}
          style={{
            fill: i === activeIndex ? colors.accentForeground : colors.foreground,
            fontSize: Math.min(cellW * 0.5, cellH * 0.5),
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          }}
        />
      ))}
    </pixiContainer>
  );
}

export default function StrumScene(props: StrumSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={props.resizeTo}
      backgroundAlpha={0}
      resolution={props.resolution}
      autoDensity
      antialias
    >
      <Strip cells={props.cells} activeIndex={props.activeIndex} />
    </Application>
  );
}
