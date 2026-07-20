/**
 * PixiJS fretboard for the guitar tool — the visual/animated layer behind {@link GuitarFretboard}'s
 * accessible controls. Draws strings, frets, position markers, and scale note dots that re-tint with
 * the theme (via {@link useThemeColors}); sounding notes glow, and playing a note emits a small
 * particle burst at every position of that pitch (skipped under reduced motion). Pointer-down on a
 * fret cell calls `onPlay`.
 *
 * Loaded lazily by {@link PixiCanvas}; never imported on the server. See
 * docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FretboardSkinPalette } from '../instrument-skins';
import { pitchName } from '../music-theory';
import { noteColor } from '../note-colors';
import type { PixiSceneBaseProps } from './PixiCanvas';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics, Text });

export interface FretboardSceneProps {
  tuning: readonly number[]; // open-string MIDI, index 0 = top row
  tuningNames: readonly string[];
  fretCount: number;
  fretMarkers: ReadonlySet<number>;
  highlighted: Set<number>; // pitch classes in the selected scale
  root: number | null; // root pitch class
  active: Set<number>; // sounding MIDI notes → glow
  showLabels: boolean;
  flats: boolean;
  /** `left` mirrors the board horizontally (nut on the right) for left-handed players. */
  handedness?: 'left' | 'right';
  /** Fixed skin palette; when absent the board follows the live theme tokens. */
  skin?: FretboardSkinPalette | null;
  /** Draw a gloss highlight (pixi-kind skins). */
  gloss?: boolean;
  /** Draw faint wood-grain streaks (material/pixi wood skins). */
  woodGrain?: boolean;
  /** Colour every note by pitch class (A red, B blue, …) so notes are identifiable at a glance. */
  colorNotes?: boolean;
  /** Note-on: pointer pressed a fret cell (starts a strum/slide drag). */
  onPlay: (midi: number) => void;
  /** Strum/slide step: the pointer slid onto a cell while a drag is in progress. */
  onGlide?: (midi: number) => void;
  /** Drag ended (pointer up / left the canvas). */
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
}

const GUTTER_LEFT = 26;
const GUTTER_TOP = 16;
const noDraw = () => {};

/** Pick a readable text colour (near-black or near-white) for a label sitting on `color`. */
function contrastText(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? 0x1a1712 : 0xf7f2e8;
}

function Board({
  tuning,
  tuningNames,
  fretCount,
  fretMarkers,
  highlighted,
  root,
  active,
  showLabels,
  flats,
  handedness = 'right',
  skin,
  gloss,
  woodGrain,
  colorNotes,
  onPlay,
  onGlide,
  onRelease,
  reducedMotion,
}: FretboardSceneProps & { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const particles = useRef<Particle[]>([]);
  const particleGraphics = useRef<Graphics | null>(null);
  const prevActive = useRef<Set<number>>(new Set());

  // Follow the container's size. `resizeTo` only reacts to window resizes, so observe the container and
  // resize the renderer — the canvas then fills its box even when it grows via CSS alone (fullscreen or
  // cinema mode, which don't fire a window-resize event).
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
    const left = handedness === 'left' ? 0 : GUTTER_LEFT; // board's left edge (gutter flips sides)
    const boardW = Math.max(size.w - GUTTER_LEFT, 0);
    const boardH = Math.max(size.h - GUTTER_TOP, 0);
    const fretW = boardW / (fretCount + 1);
    const stringH = boardH / tuning.length;
    // The string-name gutter sits opposite the board — right for left-handed, left otherwise.
    const nameX = handedness === 'left' ? left + boardW + GUTTER_LEFT / 2 : GUTTER_LEFT / 2;
    // Left edge of a fret column; left-handed mirrors columns across the board.
    const colLeft = (fret: number) =>
      handedness === 'left' ? left + boardW - (fret + 1) * fretW : left + fret * fretW;
    const cellCenter = (stringIndex: number, fret: number) => ({
      x: colLeft(fret) + fretW / 2,
      y: GUTTER_TOP + stringIndex * stringH + stringH / 2,
    });
    const nutX = handedness === 'left' ? left + boardW - fretW : left + fretW;
    return { left, boardW, boardH, fretW, stringH, nameX, colLeft, cellCenter, nutX };
  }, [size, fretCount, tuning.length, handedness]);

  // Particle burst from each newly-sounding note (at every fret position of that pitch).
  useEffect(() => {
    if (reducedMotion || geo.fretW === 0) {
      prevActive.current = new Set(active);
      return;
    }
    for (const midi of active) {
      if (prevActive.current.has(midi)) {
        continue;
      }
      tuning.forEach((open, stringIndex) => {
        for (let fret = 0; fret <= fretCount; fret += 1) {
          if (open + fret !== midi) {
            continue;
          }
          const { x, y } = geo.cellCenter(stringIndex, fret);
          for (let i = 0; i < 8; i += 1) {
            particles.current.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 2.2,
              vy: (Math.random() - 0.5) * 2.2,
              life: 1,
              max: 0.5 + Math.random() * 0.4,
              r: 1.2 + Math.random() * 1.8,
            });
          }
        }
      });
    }
    prevActive.current = new Set(active);
  }, [active, tuning, fretCount, geo, reducedMotion]);

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

  // Static board: surface, string lines, fret lines, nut, position markers.
  const drawBoard = useCallback(
    (g: Graphics) => {
      g.clear();
      const { left, boardW, boardH, fretW, stringH } = geo;
      // Board surface — material/pixi skins paint a solid board; the token skin stays transparent.
      if (skin) {
        g.roundRect(left, GUTTER_TOP, boardW, boardH, 4).fill({ color: skin.board });
        if (woodGrain) {
          for (const t of [0.22, 0.5, 0.78]) {
            const y = GUTTER_TOP + boardH * t;
            g.moveTo(left, y).lineTo(left + boardW, y);
          }
          g.stroke({ color: 0x000000, alpha: 0.06, width: 1 });
        }
        if (gloss) {
          g.roundRect(left, GUTTER_TOP, boardW, boardH * 0.35, 4).fill({
            color: 0xffffff,
            alpha: 0.06,
          });
        }
        g.roundRect(left, GUTTER_TOP, boardW, boardH, 4).stroke({
          color: skin.boardEdge,
          width: 1,
        });
      }
      // Position markers (behind strings).
      const markerColor = skin?.marker ?? colors.muted;
      for (const f of fretMarkers) {
        if (f > fretCount) {
          continue;
        }
        const cx = geo.colLeft(f) + fretW / 2;
        const ys =
          f === 12
            ? [GUTTER_TOP + boardH * 0.3, GUTTER_TOP + boardH * 0.7]
            : [GUTTER_TOP + boardH / 2];
        for (const cy of ys) {
          g.circle(cx, cy, Math.min(fretW, stringH) * 0.18).fill({ color: markerColor });
        }
      }
      // Strings (horizontal).
      for (let s = 0; s < tuning.length; s += 1) {
        const y = GUTTER_TOP + s * stringH + stringH / 2;
        g.moveTo(left, y).lineTo(left + boardW, y);
      }
      g.stroke({ color: skin?.string ?? colors.border, width: 1 });
      // Fret lines (vertical); the nut is heavier.
      for (let f = 0; f <= fretCount + 1; f += 1) {
        const x = left + f * fretW;
        g.moveTo(x, GUTTER_TOP).lineTo(x, GUTTER_TOP + boardH);
      }
      g.stroke({ color: skin?.fret ?? colors.border, width: 1 });
      g.moveTo(geo.nutX, GUTTER_TOP)
        .lineTo(geo.nutX, GUTTER_TOP + boardH)
        .stroke({ color: skin?.nut ?? colors.mutedForeground, width: 3 });
    },
    [geo, tuning.length, fretCount, fretMarkers, colors, skin, gloss, woodGrain],
  );

  const drawCell = useCallback(
    (g: Graphics, stringIndex: number, fret: number, midi: number) => {
      const { x, y } = geo.cellCenter(stringIndex, fret);
      const pc = midi % 12;
      const inScale = highlighted.has(pc);
      const isRoot = root !== null && pc === root;
      const isActive = active.has(midi);
      const radius = Math.min(geo.fretW, geo.stringH) * 0.34;
      g.clear();
      // Transparent hit area covering the whole cell.
      g.rect(
        geo.colLeft(fret),
        GUTTER_TOP + stringIndex * geo.stringH,
        geo.fretW,
        geo.stringH,
      ).fill({
        color: colors.card,
        alpha: 0.001,
      });
      if (colorNotes) {
        // Colour every note by its pitch class; the opaque dot also hides the string behind it.
        const fill = noteColor(pc);
        g.circle(x, y, radius).fill({ color: fill });
        if (isRoot) {
          g.circle(x, y, radius + 2.5).stroke({ color: contrastText(fill), width: 2 });
        }
        if (isActive) {
          g.circle(x, y, radius + 3).stroke({ color: skin?.dotActive ?? colors.ring, width: 2 });
        }
      } else if (inScale || isActive) {
        // A scale/played note: an opaque dot that also hides the string running behind it.
        const fill = isRoot ? (skin?.root ?? colors.primary) : (skin?.dot ?? colors.accent);
        g.circle(x, y, radius).fill({ color: fill });
        if (isActive) {
          g.circle(x, y, radius + 3).stroke({ color: skin?.dotActive ?? colors.ring, width: 2 });
        }
      } else if (showLabels) {
        // Plain note name: mask the string with a board-coloured pill so the label reads on a clean
        // patch instead of having the string cut through it (esp. on dark/coloured skins).
        const chipW = Math.min(geo.fretW * 0.8, 20);
        const chipH = Math.min(geo.stringH * 0.62, 13);
        g.roundRect(x - chipW / 2, y - chipH / 2, chipW, chipH, chipH / 2).fill({
          color: skin?.board ?? colors.muted,
        });
      }
    },
    [geo, highlighted, root, active, colors, skin, showLabels, colorNotes],
  );

  if (!isInitialised || geo.fretW === 0) {
    return null;
  }

  const labelStyle = (color: number) => ({
    fill: color,
    fontSize: 9,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  });

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBoard} />
      {/* Fret numbers. */}
      {Array.from({ length: fretCount + 1 }, (_, f) => f).map((f) => (
        <pixiText
          key={`fn-${f}`}
          text={String(f)}
          anchor={0.5}
          x={geo.colLeft(f) + geo.fretW / 2}
          y={GUTTER_TOP / 2}
          style={labelStyle(skin?.label ?? colors.mutedForeground)}
        />
      ))}
      {/* String names. */}
      {tuningNames.map((name, s) => (
        <pixiText
          key={`sn-${name}-${s}`}
          text={name}
          anchor={0.5}
          x={geo.nameX}
          y={GUTTER_TOP + s * geo.stringH + geo.stringH / 2}
          style={labelStyle(skin?.label ?? colors.mutedForeground)}
        />
      ))}
      {/* Interactive cells + note labels. */}
      {tuning.flatMap((open, stringIndex) =>
        Array.from({ length: fretCount + 1 }, (_, fret) => {
          const midi = open + fret;
          const pc = midi % 12;
          const inScale = highlighted.has(pc);
          const isActive = active.has(midi);
          const isRoot = root !== null && pc === root;
          // On a dot, contrast the label against the dot's own fill (note colour, or the skin's scale
          // dot which varies — dark dots on amber, light dots on ebony); otherwise it's a plain name.
          const labelColor = colorNotes
            ? contrastText(noteColor(pc))
            : inScale || isActive
              ? contrastText(isRoot ? (skin?.root ?? colors.primary) : (skin?.dot ?? colors.accent))
              : (skin?.label ?? colors.mutedForeground);
          const { x, y } = geo.cellCenter(stringIndex, fret);
          return (
            <pixiContainer key={`${stringIndex}-${fret}`}>
              <pixiGraphics
                eventMode="static"
                cursor="pointer"
                onPointerDown={() => onPlay(midi)}
                onPointerEnter={() => onGlide?.(midi)}
                onPointerUp={() => onRelease?.()}
                onPointerUpOutside={() => onRelease?.()}
                draw={(g: Graphics) => drawCell(g, stringIndex, fret, midi)}
              />
              {(showLabels || inScale) && (
                <pixiText
                  text={pitchName(pc, flats)}
                  anchor={0.5}
                  x={x}
                  y={y}
                  style={labelStyle(labelColor)}
                />
              )}
            </pixiContainer>
          );
        }),
      )}
      <pixiGraphics ref={particleGraphics} draw={noDraw} />
    </pixiContainer>
  );
}

export default function FretboardScene({
  resizeTo,
  reducedMotion,
  resolution,
  ...scene
}: FretboardSceneProps & PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Board {...scene} reducedMotion={reducedMotion} />
    </Application>
  );
}
