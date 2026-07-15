/**
 * PixiJS rhythm strip — the visual behind {@link Rhythm}. Draws one bar of note-value blocks whose
 * WIDTH is proportional to each value's duration (a whole note fills the bar; four quarters split it in
 * four), labelled with the value, and highlights the block currently sounding. Presentational only;
 * re-tints via {@link useThemeColors}. Lazily loaded by {@link PixiCanvas}; never runs on the server.
 * See docs/features/pixi-visualization.md and ADR 0029.
 */
import { Application, extend, useApplication } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import type { PixiSceneBaseProps } from '@/components/PixiCanvas';
import { BEATS, valueLabel } from '@/lib/rhythm';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics, Text });

export interface RhythmSceneProps {
  /** Note-value tokens for one bar, e.g. `["quarter","quarter","quarter","quarter"]`. */
  values: string[];
  /** Index of the value currently sounding, or -1. */
  activeIndex: number;
}

function Strip({ values, activeIndex }: RhythmSceneProps) {
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

  const pad = 10;
  const gap = 4;
  const totalBeats = values.reduce((s, v) => s + (BEATS[v] ?? 1), 0) || 1;
  const avail = size.w - pad * 2 - gap * (values.length - 1);
  const cellH = Math.min(size.h - pad * 2, 72);
  const top = (size.h - cellH) / 2;
  // Precompute each block's x + width from cumulative beats.
  let cursor = pad;
  const rects = values.map((v) => {
    const w = (avail * (BEATS[v] ?? 1)) / totalBeats;
    const x = cursor;
    cursor += w + gap;
    return { x, w };
  });

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      values.forEach((_, i) => {
        const { x, w } = rects[i];
        const on = i === activeIndex;
        g.roundRect(x, top, w, cellH, 8);
        g.fill({ color: on ? colors.accent : colors.card });
        g.roundRect(x, top, w, cellH, 8);
        g.stroke({ color: on ? colors.ring : colors.border, width: on ? 2 : 1 });
      });
    },
    // rects derives from values+size; list the primitive inputs.
    [values, activeIndex, avail, totalBeats, cellH, top, colors],
  );

  if (size.w === 0) return null;
  return (
    <pixiContainer>
      <pixiGraphics draw={draw} />
      {values.map((v, i) => (
        <pixiText
          key={`v${i}`}
          text={valueLabel(v)}
          anchor={0.5}
          x={rects[i].x + rects[i].w / 2}
          y={top + cellH / 2}
          style={{
            fill: i === activeIndex ? colors.accentForeground : colors.foreground,
            fontSize: 13,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          }}
        />
      ))}
    </pixiContainer>
  );
}

export default function RhythmScene(props: RhythmSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={props.resizeTo}
      backgroundAlpha={0}
      resolution={props.resolution}
      autoDensity
      antialias
    >
      <Strip values={props.values} activeIndex={props.activeIndex} />
    </Application>
  );
}
