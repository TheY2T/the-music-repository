/**
 * PixiJS keybed for the piano tool — the visual/animated layer behind {@link PianoKeyboard}'s
 * accessible controls. Draws GPU keys that re-tint with the theme (via {@link useThemeColors}) or a
 * fixed skin palette, lights sounding notes, and emits a note-on particle burst (skipped under reduced
 * motion). In `stage` (fullscreen) mode the keyboard is pinned to the bottom at a realistic aspect ratio
 * and the space above becomes a reactive effects region — colour-per-note light beams and rising particle
 * fountains for every held key. Pointer-down on a key calls `onPlay`.
 *
 * Loaded lazily by {@link PixiCanvas}; never imported on the server. See
 * docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardSkinPalette } from '../instrument-skins';
import { pitchName } from '../music-theory';
import type { PixiSceneBaseProps } from './PixiCanvas';
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
  /** Fixed skin palette; when absent the keys follow the live theme tokens. */
  skin?: KeyboardSkinPalette | null;
  /** Draw a gloss highlight on keys (pixi-kind skins). */
  gloss?: boolean;
  /**
   * Fullscreen "stage" mode: pin an aspect-correct keyboard to the bottom and turn the space above into a
   * reactive effects region (colour-per-note beams + rising particle fountains). Off = the keys fill the
   * canvas as in the windowed view.
   */
  stage?: boolean;
  /** Note-on: pointer pressed a key (starts a drag glissando). */
  onPlay: (midi: number) => void;
  /** Glissando step: the pointer slid onto a key while a drag is in progress. */
  onGlide?: (midi: number) => void;
  /** Note-off: the drag ended (pointer up / left the canvas). Enables sustain. */
  onRelease?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color?: number;
}

const noteLabel = (midi: number, flats: boolean) =>
  `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;

/** A vivid `0xRRGGBB` colour from HSL — used to give each pitch class its own hue in stage mode. */
function hslToRgbInt(h: number, s: number, l: number): number {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

/** A consistent rainbow colour for a pitch class (0–11), matching the piano-vfx look. */
const pitchColor = (pc: number): number => hslToRgbInt((pc / 12) * 360, 0.85, 0.6);

/** The playing area cap in stage mode (fraction of canvas height the keyboard may occupy). */
const STAGE_KEYBOARD_FRACTION = 0.42;
/** White-key height : width — a realistic keyboard aspect so keys don't stretch in fullscreen. */
const WHITE_ASPECT = 5.2;
/** Ceiling on live particles so many held notes can't run the fountain away. */
const MAX_PARTICLES = 800;

/** Initial no-op paint for a Graphics we drive imperatively via ref in the ticker. */
const noDraw = () => {};

function Keybed({
  whiteMidis,
  blackMidis,
  highlighted,
  active,
  showLabels,
  flats,
  skin,
  gloss,
  stage,
  onPlay,
  onGlide,
  onRelease,
  reducedMotion,
}: PianoSceneProps & { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const particles = useRef<Particle[]>([]);
  const particleGraphics = useRef<Graphics | null>(null);
  const prevActive = useRef<Set<number>>(new Set());

  // Track the container size so key geometry follows it. `resizeTo` only reacts to window resizes, so
  // observe the container directly and resize the renderer — the canvas then fills its box even when it
  // grows via CSS alone (e.g. entering fullscreen without a window-resize event).
  useEffect(() => {
    if (!isInitialised || !app?.canvas) {
      return;
    }
    const parent = app.canvas.parentElement;
    const read = () => {
      const w = Math.round(parent?.clientWidth ?? app.screen.width);
      const h = Math.round(parent?.clientHeight ?? app.screen.height);
      if (
        w > 0 &&
        h > 0 &&
        (Math.abs(w - app.screen.width) > 1 || Math.abs(h - app.screen.height) > 1)
      ) {
        app.renderer.resize(w, h);
      }
      setSize({ w: app.screen.width, h: app.screen.height });
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(parent ?? app.canvas);
    return () => observer.disconnect();
  }, [isInitialised, app]);

  const geo = useMemo(() => {
    const whiteWidth = size.w / Math.max(whiteMidis.length, 1);
    // Stage mode caps the keyboard to a realistic aspect and pins it to the bottom; the space above
    // becomes the effects region. Windowed mode keeps the keys filling the canvas (top = 0).
    const whiteHeight = stage
      ? Math.max(120, Math.min(whiteWidth * WHITE_ASPECT, size.h * STAGE_KEYBOARD_FRACTION))
      : size.h;
    const top = size.h - whiteHeight;
    const blackWidth = whiteWidth * 0.62;
    const blackHeight = whiteHeight * 0.62;
    const whiteX = new Map(whiteMidis.map((m, i) => [m, i * whiteWidth]));
    return { whiteWidth, whiteHeight, blackWidth, blackHeight, whiteX, top, vfxHeight: top };
  }, [size, whiteMidis, stage]);

  // Centre-x of a key (white or black) — used to anchor the stage beams + particle fountains.
  const keyCenterX = useCallback(
    (midi: number) => {
      const black = blackMidis.find((b) => b.midi === midi);
      return black
        ? (black.afterWhiteIndex + 1) * geo.whiteWidth
        : (geo.whiteX.get(midi) ?? 0) + geo.whiteWidth / 2;
    },
    [blackMidis, geo],
  );

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
      const x = keyCenterX(midi);
      // Stage: a colourful upward burst from the key top; windowed: the subtle accent burst near the keys.
      const y = stage ? geo.top : geo.whiteHeight * 0.75;
      const color = stage ? pitchColor(midi % 12) : undefined;
      const count = stage ? 20 : 12;
      for (let i = 0; i < count; i += 1) {
        particles.current.push({
          x: x + (stage ? (Math.random() - 0.5) * geo.whiteWidth * 0.6 : 0),
          y,
          vx: (Math.random() - 0.5) * (stage ? 1.2 : 1.6),
          vy: stage ? -2.6 - Math.random() * 2.6 : -1.6 - Math.random() * 1.8,
          life: 1,
          max: stage ? 1.1 + Math.random() * 0.9 : 0.6 + Math.random() * 0.5,
          r: 1.5 + Math.random() * (stage ? 2.5 : 2),
          color,
        });
      }
    }
    prevActive.current = new Set(active);
  }, [active, keyCenterX, geo, stage, reducedMotion]);

  // Per-frame effects: stage beams + fountains for held notes, then particle integration + imperative
  // redraw (no React churn).
  useTick(
    useCallback(
      (ticker: { deltaTime: number }) => {
        const g = particleGraphics.current;
        if (!g) {
          return;
        }
        const dt = ticker.deltaTime;
        g.clear();

        // Stage: a glowing colour-per-note beam rising above each held key, plus a steady fountain.
        if (stage && !reducedMotion && geo.top > 0) {
          for (const midi of active) {
            const x = keyCenterX(midi);
            const color = pitchColor(midi % 12);
            const beamW = geo.whiteWidth * 0.7;
            g.rect(x - beamW / 2, 0, beamW, geo.top).fill({ color, alpha: 0.06 });
            g.rect(x - beamW * 0.16, 0, beamW * 0.32, geo.top).fill({ color, alpha: 0.14 });
            if (particles.current.length < MAX_PARTICLES) {
              for (let i = 0; i < 2; i += 1) {
                particles.current.push({
                  x: x + (Math.random() - 0.5) * beamW,
                  y: geo.top,
                  vx: (Math.random() - 0.5) * 0.9,
                  vy: -2.4 - Math.random() * 2.4,
                  life: 1,
                  max: 1.1 + Math.random() * 0.9,
                  r: 1.5 + Math.random() * 2.5,
                  color,
                });
              }
            }
          }
        }

        const live: Particle[] = [];
        for (const p of particles.current) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += (stage ? 0.012 : 0.04) * dt; // stage particles drift up longer; windowed fall back sooner
          p.life -= (dt / 60) * (1 / p.max);
          if (p.life > 0 && p.y > -10) {
            g.circle(p.x, p.y, p.r).fill({
              color: p.color ?? colors.accent,
              alpha: Math.max(p.life, 0) * 0.85,
            });
            live.push(p);
          }
        }
        particles.current = live;
      },
      [stage, reducedMotion, active, keyCenterX, geo, colors.accent],
    ),
  );

  // Effective key colours: the skin palette when set, otherwise the live theme tokens.
  const whiteKey = skin?.whiteKey ?? colors.card;
  const whiteKeyActive = skin?.whiteKeyActive ?? colors.ring;
  const blackKey = skin?.blackKey ?? colors.foreground;
  const blackKeyActive = skin?.blackKeyActive ?? colors.ring;
  const blackKeyScale = skin?.scale ?? colors.primary;
  const scaleFill = skin?.scale ?? colors.accent;
  const keyBorder = skin?.border ?? colors.border;

  const drawWhite = useCallback(
    (g: Graphics, midi: number) => {
      const x = geo.whiteX.get(midi) ?? 0;
      const top = geo.top;
      const inScale = highlighted.has(midi % 12);
      const isActive = active.has(midi);
      g.clear();
      g.roundRect(x + 1, top, geo.whiteWidth - 2, geo.whiteHeight, 4).fill({
        color: isActive ? whiteKeyActive : whiteKey,
      });
      if (inScale && !isActive) {
        g.roundRect(x + 1, top, geo.whiteWidth - 2, geo.whiteHeight, 4).fill({
          color: scaleFill,
          alpha: 0.28,
        });
      }
      if (gloss) {
        g.roundRect(x + 2, top + 1, geo.whiteWidth - 4, geo.whiteHeight * 0.4, 4).fill({
          color: 0xffffff,
          alpha: 0.1,
        });
      }
      g.roundRect(x + 1, top, geo.whiteWidth - 2, geo.whiteHeight, 4).stroke({
        color: keyBorder,
        width: 1,
      });
    },
    [geo, highlighted, active, whiteKey, whiteKeyActive, scaleFill, keyBorder, gloss],
  );

  const drawBlack = useCallback(
    (g: Graphics, midi: number, afterWhiteIndex: number) => {
      const cx = (afterWhiteIndex + 1) * geo.whiteWidth;
      const x = cx - geo.blackWidth / 2;
      const top = geo.top;
      const inScale = highlighted.has(midi % 12);
      const isActive = active.has(midi);
      const fill = isActive ? blackKeyActive : inScale ? blackKeyScale : blackKey;
      g.clear();
      g.roundRect(x, top, geo.blackWidth, geo.blackHeight, 3).fill({ color: fill });
      if (gloss) {
        g.roundRect(x + 1, top + 1, geo.blackWidth - 2, geo.blackHeight * 0.4, 3).fill({
          color: 0xffffff,
          alpha: 0.12,
        });
      }
      g.roundRect(x, top, geo.blackWidth, geo.blackHeight, 3).stroke({
        color: keyBorder,
        width: 1,
      });
    },
    [geo, highlighted, active, blackKey, blackKeyActive, blackKeyScale, keyBorder, gloss],
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
          onPointerEnter={() => onGlide?.(midi)}
          onPointerUp={() => onRelease?.()}
          onPointerUpOutside={() => onRelease?.()}
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
            y={geo.top + geo.whiteHeight - 12}
            style={labelStyle(skin?.label ?? colors.mutedForeground, false)}
          />
        ))}
      {/* Black keys + labels on top. */}
      {blackMidis.map(({ midi, afterWhiteIndex }) => (
        <pixiGraphics
          key={midi}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => onPlay(midi)}
          onPointerEnter={() => onGlide?.(midi)}
          onPointerUp={() => onRelease?.()}
          onPointerUpOutside={() => onRelease?.()}
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
            y={geo.top + geo.blackHeight - 9}
            style={labelStyle(skin ? 0xf2ede1 : colors.background, true)}
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
