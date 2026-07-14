/**
 * PixiJS tuner meter — a needle gauge showing how sharp/flat the detected pitch is, with a green
 * "in tune" band. The pitch-detection loop lives in {@link TuningReference}; this scene just renders
 * the current note + cents and animates the needle toward the target. Colours re-tint with the theme.
 *
 * Loaded lazily by {@link PixiCanvas}; never imported on the server. See
 * docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from '@/components/PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics, Text });

export interface TunerSceneProps {
  /** Detected note label (e.g. "A4"), or null when nothing is heard. */
  note: string | null;
  /** Cents offset (−50…+50). */
  cents: number;
  /** Whether the mic is actively listening. */
  active: boolean;
}

const MAX_CENTS = 50;
const SWEEP = Math.PI / 3; // ±60° needle travel
const IN_TUNE = 5; // cents tolerance for the green zone

function Gauge({ note, cents, active }: TunerSceneProps) {
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

  const geo = {
    cx: size.w / 2,
    cy: size.h * 0.82,
    radius: Math.min(size.w * 0.42, size.h * 0.82),
  };
  const inTune = active && note !== null && Math.abs(cents) <= IN_TUNE;
  const target =
    active && note !== null
      ? (Math.max(-MAX_CENTS, Math.min(MAX_CENTS, cents)) / MAX_CENTS) * SWEEP
      : 0;

  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        const n = needle.current;
        if (!n) {
          return;
        }
        current.current += (target - current.current) * Math.min(0.25 * ticker.deltaTime, 1);
        n.rotation = current.current;
      },
      [target],
    ),
  );

  const drawGauge = useCallback(
    (g: Graphics) => {
      g.clear();
      const { cx, cy, radius } = geo;
      // Outer arc.
      g.arc(cx, cy, radius, -Math.PI / 2 - SWEEP, -Math.PI / 2 + SWEEP).stroke({
        color: colors.border,
        width: 2,
      });
      // Green "in tune" band at top centre.
      const band = (IN_TUNE / MAX_CENTS) * SWEEP;
      g.arc(cx, cy, radius, -Math.PI / 2 - band, -Math.PI / 2 + band).stroke({
        color: colors.success,
        width: 4,
      });
      // Tick marks every 10 cents.
      for (let c = -MAX_CENTS; c <= MAX_CENTS; c += 10) {
        const a = -Math.PI / 2 + (c / MAX_CENTS) * SWEEP;
        const inner = c === 0 ? radius - 14 : radius - 8;
        g.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner)
          .lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
          .stroke({ color: colors.mutedForeground, width: 1 });
      }
    },
    [geo, colors],
  );

  const drawNeedle = useCallback(
    (g: Graphics) => {
      g.clear();
      const color = inTune
        ? colors.success
        : active && note
          ? colors.accent
          : colors.mutedForeground;
      g.moveTo(0, 8)
        .lineTo(0, -geo.radius + 6)
        .stroke({ color, width: 3 });
      g.circle(0, 0, 6).fill({ color });
    },
    [geo.radius, inTune, active, note, colors],
  );

  if (!isInitialised || geo.radius === 0) {
    return null;
  }

  const noteStyle = {
    fill: inTune ? colors.success : colors.foreground,
    fontSize: Math.max(geo.radius * 0.34, 20),
    fontFamily: 'ui-serif, Georgia, serif',
    fontWeight: '700' as const,
  };
  const centsStyle = {
    fill: colors.mutedForeground,
    fontSize: 13,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  };
  const centsText = active && note ? `${cents > 0 ? '+' : ''}${cents}¢` : '';

  return (
    <pixiContainer>
      <pixiGraphics draw={drawGauge} />
      <pixiContainer ref={needle} x={geo.cx} y={geo.cy}>
        <pixiGraphics draw={drawNeedle} />
      </pixiContainer>
      <pixiText
        text={note ?? '—'}
        anchor={0.5}
        x={geo.cx}
        y={geo.cy - geo.radius * 0.42}
        style={noteStyle}
      />
      <pixiText
        text={centsText}
        anchor={0.5}
        x={geo.cx}
        y={geo.cy - geo.radius * 0.14}
        style={centsStyle}
      />
    </pixiContainer>
  );
}

export default function TunerScene({
  resizeTo,
  resolution,
  ...scene
}: TunerSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Gauge {...scene} />
    </Application>
  );
}
