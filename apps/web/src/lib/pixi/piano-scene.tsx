/**
 * PixiJS keybed for the piano tool — the visual/animated layer behind {@link PianoKeyboard}'s
 * accessible controls. Draws two octaves of GPU keys that re-tint with the theme (via
 * {@link useThemeColors}), lights sounding notes, and emits a subtle "note-fall" particle burst
 * when a note turns on (skipped under reduced motion). Pointer-down on a key calls `onPlay`.
 *
 * Loaded lazily by {@link PixiCanvas}; never imported on the server. See
 * docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from '@/components/PixiCanvas';
import { pitchName } from '@/lib/music-theory';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics, Text });

export interface PianoSceneProps {
  whiteMidis: number[];
  blackMidis: { midi: number; afterWhiteIndex: number }[];
  /** Pitch classes (0–11) to highlight as the selected scale. */
  highlighted: Set<number>;
  /** MIDI note numbers currently sounding (click or live MIDI) — lit + glowing. */
  active: Set<number>;
  showLabels: boolean;
  flats: boolean;
  /** Note-on: pointer pressed a key. */
  onPlay: (midi: number) => void;
  /** Note-off: the pressed key was released (pointer up / left the canvas). Enables sustain. */
  onRelease?: (midi: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
}

const noteLabel = (midi: number, flats: boolean) =>
  `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;

/** Initial no-op paint for a Graphics we drive imperatively via ref in the ticker. */
const noDraw = () => {};

function Keybed({
  whiteMidis,
  blackMidis,
  highlighted,
  active,
  showLabels,
  flats,
  onPlay,
  onRelease,
  reducedMotion,
}: PianoSceneProps & { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const particles = useRef<Particle[]>([]);
  const particleGraphics = useRef<Graphics | null>(null);
  const prevActive = useRef<Set<number>>(new Set());

  // Track the canvas size so key geometry follows the responsive container.
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
    const whiteWidth = size.w / Math.max(whiteMidis.length, 1);
    const whiteHeight = size.h;
    const blackWidth = whiteWidth * 0.62;
    const blackHeight = whiteHeight * 0.62;
    const whiteX = new Map(whiteMidis.map((m, i) => [m, i * whiteWidth]));
    return { whiteWidth, whiteHeight, blackWidth, blackHeight, whiteX };
  }, [size, whiteMidis]);

  // Spawn a particle burst from each note that just turned on.
  useEffect(() => {
    if (reducedMotion || geo.whiteWidth === 0) {
      prevActive.current = new Set(active);
      return;
    }
    for (const midi of active) {
      if (prevActive.current.has(midi)) {
        continue;
      }
      const black = blackMidis.find((b) => b.midi === midi);
      const x = black
        ? (black.afterWhiteIndex + 1) * geo.whiteWidth
        : (geo.whiteX.get(midi) ?? 0) + geo.whiteWidth / 2;
      for (let i = 0; i < 12; i += 1) {
        particles.current.push({
          x,
          y: geo.whiteHeight * 0.75,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -1.6 - Math.random() * 1.8,
          life: 1,
          max: 0.6 + Math.random() * 0.5,
          r: 1.5 + Math.random() * 2,
        });
      }
    }
    prevActive.current = new Set(active);
  }, [active, blackMidis, geo, reducedMotion]);

  // Per-frame particle integration + imperative redraw (no React churn).
  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        const g = particleGraphics.current;
        if (!g) {
          return;
        }
        const dt = ticker.deltaTime;
        const live: Particle[] = [];
        g.clear();
        for (const p of particles.current) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 0.04 * dt; // gentle gravity
          p.life -= (dt / 60) * (1 / p.max);
          if (p.life > 0) {
            g.circle(p.x, p.y, p.r).fill({
              color: colors.accent,
              alpha: Math.max(p.life, 0) * 0.8,
            });
            live.push(p);
          }
        }
        particles.current = live;
      },
      [colors.accent],
    ),
  );

  const drawWhite = useCallback(
    (g: Graphics, midi: number) => {
      const x = geo.whiteX.get(midi) ?? 0;
      const inScale = highlighted.has(midi % 12);
      const isActive = active.has(midi);
      g.clear();
      g.roundRect(x + 1, 0, geo.whiteWidth - 2, geo.whiteHeight, 4).fill({
        color: isActive ? colors.ring : colors.card,
      });
      if (inScale && !isActive) {
        g.roundRect(x + 1, 0, geo.whiteWidth - 2, geo.whiteHeight, 4).fill({
          color: colors.accent,
          alpha: 0.28,
        });
      }
      g.roundRect(x + 1, 0, geo.whiteWidth - 2, geo.whiteHeight, 4).stroke({
        color: colors.border,
        width: 1,
      });
    },
    [geo, highlighted, active, colors],
  );

  const drawBlack = useCallback(
    (g: Graphics, midi: number, afterWhiteIndex: number) => {
      const cx = (afterWhiteIndex + 1) * geo.whiteWidth;
      const x = cx - geo.blackWidth / 2;
      const inScale = highlighted.has(midi % 12);
      const isActive = active.has(midi);
      const fill = isActive ? colors.ring : inScale ? colors.primary : colors.foreground;
      g.clear();
      g.roundRect(x, 0, geo.blackWidth, geo.blackHeight, 3).fill({ color: fill });
      g.roundRect(x, 0, geo.blackWidth, geo.blackHeight, 3).stroke({
        color: colors.border,
        width: 1,
      });
    },
    [geo, highlighted, active, colors],
  );

  if (!isInitialised || geo.whiteWidth === 0) {
    return null;
  }

  const labelStyle = (color: number, black: boolean) => ({
    fill: color,
    fontSize: black ? 9 : 11,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  });

  return (
    <pixiContainer>
      {/* White keys (drawn first, under the black keys). */}
      {whiteMidis.map((midi) => (
        <pixiGraphics
          key={midi}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => onPlay(midi)}
          onPointerUp={() => onRelease?.(midi)}
          onPointerUpOutside={() => onRelease?.(midi)}
          draw={(g: Graphics) => drawWhite(g, midi)}
        />
      ))}
      {showLabels &&
        whiteMidis.map((midi) => (
          <pixiText
            key={`l-${midi}`}
            text={noteLabel(midi, flats)}
            anchor={0.5}
            x={(geo.whiteX.get(midi) ?? 0) + geo.whiteWidth / 2}
            y={geo.whiteHeight - 12}
            style={labelStyle(colors.mutedForeground, false)}
          />
        ))}
      {/* Black keys + labels on top. */}
      {blackMidis.map(({ midi, afterWhiteIndex }) => (
        <pixiGraphics
          key={midi}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => onPlay(midi)}
          onPointerUp={() => onRelease?.(midi)}
          onPointerUpOutside={() => onRelease?.(midi)}
          draw={(g: Graphics) => drawBlack(g, midi, afterWhiteIndex)}
        />
      ))}
      {showLabels &&
        blackMidis.map(({ midi, afterWhiteIndex }) => (
          <pixiText
            key={`l-${midi}`}
            text={noteLabel(midi, flats)}
            anchor={0.5}
            x={(afterWhiteIndex + 1) * geo.whiteWidth}
            y={geo.blackHeight - 9}
            style={labelStyle(colors.background, true)}
          />
        ))}
      <pixiGraphics ref={particleGraphics} draw={noDraw} />
    </pixiContainer>
  );
}

export default function PianoScene({
  resizeTo,
  reducedMotion,
  resolution,
  ...scene
}: PianoSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Keybed {...scene} reducedMotion={reducedMotion} />
    </Application>
  );
}
