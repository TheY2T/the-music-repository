/**
 * PixiJS circle-of-fifths wheel — the visual/animated layer behind {@link CircleOfFifths}'s detail
 * panel. Draws the twelve major keys (with relative-minor labels) around a ring that re-tints with
 * the theme (via {@link useThemeColors}); a needle animates to the selected key and voice-leading
 * arcs connect it to its neighbours (both static under reduced motion). Pointer-down on a key node
 * calls `onSelect`.
 *
 * Loaded lazily by {@link PixiCanvas}; never imported on the server. See
 * docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics, Text });

export interface CircleEntry {
  major: string;
  relativeMinor: string;
}

export interface CircleSceneProps {
  entries: readonly CircleEntry[];
  selected: number;
  onSelect: (index: number) => void;
}

/** Screen angle (radians) of wheel position `index`, 0 = 12 o'clock, clockwise. */
const nodeAngle = (index: number, count: number) => (index / count) * Math.PI * 2 - Math.PI / 2;

/** Shortest signed delta between two angles, in radians. */
function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function Wheel({
  entries,
  selected,
  onSelect,
  reducedMotion,
}: CircleSceneProps & { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const needle = useRef<Container | null>(null);
  const current = useRef(0);

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

  const geo = useMemo(() => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    const outerR = Math.min(size.w, size.h) * 0.42;
    const innerR = outerR * 0.62;
    const nodeR = outerR * 0.16;
    const pos = (index: number, radius: number) => {
      const a = nodeAngle(index, entries.length);
      return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
    };
    return { cx, cy, outerR, innerR, nodeR, pos };
  }, [size, entries.length]);

  // Animate the needle toward the selected key (imperative — no per-frame React render).
  const target = useRef(0);
  useEffect(() => {
    target.current = (selected / entries.length) * Math.PI * 2;
  }, [selected, entries.length]);

  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        const n = needle.current;
        if (!n) {
          return;
        }
        if (reducedMotion) {
          current.current = target.current;
        } else {
          current.current +=
            angleDelta(current.current, target.current) * Math.min(0.2 * ticker.deltaTime, 1);
        }
        n.rotation = current.current;
      },
      [reducedMotion],
    ),
  );

  const drawNeedle = useCallback(
    (g: Graphics) => {
      g.clear();
      // Drawn pointing up (rotation 0); the ticker rotates it to the selected key.
      g.moveTo(0, -6)
        .lineTo(0, -geo.innerR * 0.72)
        .stroke({ color: colors.accent, width: 3 });
      g.circle(0, -geo.innerR * 0.72, 4).fill({ color: colors.accent });
    },
    [geo.innerR, colors.accent],
  );

  const drawRings = useCallback(
    (g: Graphics) => {
      g.clear();
      g.circle(geo.cx, geo.cy, geo.outerR + geo.nodeR).stroke({ color: colors.border, width: 1 });
      g.circle(geo.cx, geo.cy, geo.innerR - geo.nodeR * 0.5).stroke({
        color: colors.border,
        width: 1,
      });
      // Voice-leading arcs from the selected key to its two neighbours.
      const neighbours = [
        (selected + 1) % entries.length,
        (selected - 1 + entries.length) % entries.length,
      ];
      const from = geo.pos(selected, geo.outerR);
      for (const nb of neighbours) {
        const to = geo.pos(nb, geo.outerR);
        g.moveTo(from.x, from.y)
          .quadraticCurveTo(geo.cx, geo.cy, to.x, to.y)
          .stroke({ color: colors.accent, width: 1.5, alpha: 0.5 });
      }
    },
    [geo, selected, entries.length, colors],
  );

  if (!isInitialised || geo.outerR === 0) {
    return null;
  }

  const majorStyle = (color: number) => ({
    fill: color,
    fontSize: Math.max(geo.nodeR * 0.7, 9),
    fontFamily: 'ui-serif, Georgia, serif',
    fontWeight: '600' as const,
  });
  const minorStyle = {
    fill: colors.mutedForeground,
    fontSize: Math.max(geo.nodeR * 0.5, 8),
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  };

  return (
    <pixiContainer>
      <pixiGraphics draw={drawRings} />
      <pixiContainer ref={needle} x={geo.cx} y={geo.cy}>
        <pixiGraphics draw={drawNeedle} />
      </pixiContainer>
      {entries.map((entry, index) => {
        const outer = geo.pos(index, geo.outerR);
        const inner = geo.pos(index, geo.innerR);
        const isSelected = index === selected;
        return (
          <pixiContainer key={entry.major}>
            <pixiGraphics
              eventMode="static"
              cursor="pointer"
              onPointerDown={() => onSelect(index)}
              draw={(g: Graphics) => {
                g.clear();
                g.circle(outer.x, outer.y, geo.nodeR).fill({
                  color: isSelected ? colors.primary : colors.card,
                });
                g.circle(outer.x, outer.y, geo.nodeR).stroke({
                  color: isSelected ? colors.ring : colors.border,
                  width: isSelected ? 2 : 1,
                });
              }}
            />
            <pixiText
              text={entry.major}
              anchor={0.5}
              x={outer.x}
              y={outer.y}
              style={majorStyle(isSelected ? colors.primaryForeground : colors.foreground)}
            />
            <pixiText
              text={entry.relativeMinor}
              anchor={0.5}
              x={inner.x}
              y={inner.y}
              style={minorStyle}
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}

export default function CircleScene({
  resizeTo,
  reducedMotion,
  resolution,
  ...scene
}: CircleSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Wheel {...scene} reducedMotion={reducedMotion} />
    </Application>
  );
}
