/**
 * PixiJS chord board — the visual layer behind {@link ChordBoard}. Draws a row of tappable chord
 * cards (each a symbol + optional Roman-numeral label); pressing a card calls `onPress` (the island
 * sounds the chord) and the pressed card highlights. Presentational only; re-tints with the theme via
 * {@link useThemeColors}. Loaded lazily by {@link PixiCanvas}; never runs on the server. See
 * docs/features/pixi-visualization.md and ADR 0029.
 */
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics, Text });

export interface ChordBoardItem {
  symbol: string;
  label?: string;
}

export interface ChordBoardSceneProps {
  items: ChordBoardItem[];
  /** Index of the last-pressed card, or -1. */
  active: number;
  onPress: (index: number) => void;
}

function Board({ items, active, onPress }: ChordBoardSceneProps) {
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

  const n = Math.max(1, items.length);
  const pad = 10;
  const gap = 8;
  const cardW = (size.w - pad * 2 - gap * (n - 1)) / n;
  const cardH = Math.min(size.h - pad * 2, 96);
  const top = (size.h - cardH) / 2;
  const cardX = (i: number) => pad + i * (cardW + gap);

  const drawCard = useCallback(
    (g: Graphics, i: number) => {
      g.clear();
      g.roundRect(0, 0, cardW, cardH, 10);
      g.fill({ color: i === active ? colors.accent : colors.card });
      g.roundRect(0, 0, cardW, cardH, 10);
      g.stroke({ color: i === active ? colors.ring : colors.border, width: i === active ? 2 : 1 });
    },
    [cardW, cardH, active, colors],
  );

  if (size.w === 0) return null;
  return (
    <pixiContainer>
      {items.map((item, i) => (
        <pixiContainer
          key={`${item.symbol}-${i}`}
          x={cardX(i)}
          y={top}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => onPress(i)}
        >
          <pixiGraphics draw={(g: Graphics) => drawCard(g, i)} />
          {item.label ? (
            <pixiText
              text={item.label}
              anchor={{ x: 0.5, y: 0 }}
              x={cardW / 2}
              y={10}
              style={{
                fill: i === active ? colors.accentForeground : colors.mutedForeground,
                fontSize: 13,
                fontFamily: 'serif',
                fontStyle: 'italic',
              }}
            />
          ) : null}
          <pixiText
            text={item.symbol}
            anchor={0.5}
            x={cardW / 2}
            y={cardH / 2 + (item.label ? 6 : 0)}
            style={{
              fill: i === active ? colors.accentForeground : colors.foreground,
              fontSize: Math.min(cardW * 0.3, 22),
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
            }}
          />
        </pixiContainer>
      ))}
    </pixiContainer>
  );
}

export default function ChordBoardScene(props: ChordBoardSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={props.resizeTo}
      backgroundAlpha={0}
      resolution={props.resolution}
      autoDensity
      antialias
    >
      <Board items={props.items} active={props.active} onPress={props.onPress} />
    </Application>
  );
}
