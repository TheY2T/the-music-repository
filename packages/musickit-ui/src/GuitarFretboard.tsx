import { type Locale, t } from '@TheY2T/tmr-i18n';
import { useToolInstrument } from '@TheY2T/tmr-music-core/instrument-choice';
import { fretboardSkin } from '@TheY2T/tmr-music-core/instrument-skins';
import {
  FRET_MARKERS,
  pitchName,
  ROOT_CHOICES,
  SCALES,
  STANDARD_TUNING,
  STANDARD_TUNING_NAMES,
  scalePitchClasses,
  scalesByLevel,
} from '@TheY2T/tmr-music-core/music-theory';
import { noteColorHex, noteTextColorHex } from '@TheY2T/tmr-music-core/note-colors';
import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import { playNote } from '@TheY2T/tmr-music-core/soundfont';
import { useLevel } from '@TheY2T/tmr-music-core/use-level';
import { cn, Select, ToolStage } from '@TheY2T/tmr-ui';
import { useInstrumentPreferences } from '@TheY2T/tmr-web-acl/instrument-preferences';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InstrumentControls } from './InstrumentControls';
import InstrumentLoading from './InstrumentLoading';
import InstrumentPicker from './InstrumentPicker';
import LevelToggle from './LevelToggle';

const FRET_COUNT = 15;
const frets = Array.from({ length: FRET_COUNT + 1 }, (_, f) => f);

const noteLabel = (midi: number, flats: boolean) =>
  `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;

interface GuitarFretboardProps {
  locale?: Locale;
  /** When true, shows the skin/handedness/fullscreen controls and honours saved preferences. */
  customization?: boolean;
}

export default function GuitarFretboard({
  locale = 'en',
  customization = false,
}: GuitarFretboardProps = {}) {
  const { level, setLevel } = useLevel();
  const { preferences, update } = useInstrumentPreferences();
  // When customization is off the tool renders exactly as its base view: right-handed, default skin.
  const handedness = customization ? preferences.handedness : 'right';
  const skin = fretboardSkin(customization ? preferences.fretboardSkin : 'theme');
  const { instrument, setInstrument, ready } = useToolInstrument('guitar');
  const [showLabels, setShowLabels] = useState(true);
  const [colorNotes, setColorNotes] = useState(false);
  const [root, setRoot] = useState<number | null>(null);
  const [scaleKey, setScaleKey] = useState('minor-pentatonic');
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [active, setActive] = useState<Set<number>>(new Set());
  const releaseTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const scaleChoices = scalesByLevel(level);
  useEffect(() => {
    if (!scaleChoices.some((s) => s.key === scaleKey)) {
      setScaleKey(scaleChoices[0]?.key ?? 'major');
    }
  }, [scaleChoices, scaleKey]);

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const highlighted = useMemo(
    () => (root === null ? new Set<number>() : scalePitchClasses(root, scale.intervals)),
    [root, scale],
  );
  const flats = root !== null && [1, 3, 5, 8, 10].includes(root);

  const play = useCallback(
    (midi: number) => {
      playNote(midi, 0.8);
      setLastNote(noteLabel(midi, flats));
      setActive((prev) => new Set(prev).add(midi));
      const timers = releaseTimers.current;
      clearTimeout(timers.get(midi));
      timers.set(
        midi,
        setTimeout(() => {
          setActive((prev) => {
            const next = new Set(prev);
            next.delete(midi);
            return next;
          });
          timers.delete(midi);
        }, 450),
      );
    },
    [flats],
  );

  // Strum / slide: pressing a fret starts a drag, and sliding the pointer across cells sounds each new
  // one — dragging vertically across the strings strums them, horizontally slides along a string.
  const dragging = useRef(false);
  const lastStrummed = useRef<number | null>(null);

  const strumStart = useCallback(
    (midi: number) => {
      dragging.current = true;
      lastStrummed.current = midi;
      play(midi);
    },
    [play],
  );

  const strumOver = useCallback(
    (midi: number) => {
      if (!dragging.current || lastStrummed.current === midi) return;
      lastStrummed.current = midi;
      play(midi);
    },
    [play],
  );

  const strumEnd = useCallback(() => {
    dragging.current = false;
    lastStrummed.current = null;
  }, []);

  // End the strum wherever the pointer is released (outside the canvas, or off-window).
  useEffect(() => {
    window.addEventListener('pointerup', strumEnd);
    window.addEventListener('pointercancel', strumEnd);
    return () => {
      window.removeEventListener('pointerup', strumEnd);
      window.removeEventListener('pointercancel', strumEnd);
    };
  }, [strumEnd]);

  // Accessible, token-themed fret grid — the real control surface (visible when WebGL is
  // unavailable; operable but visually hidden behind the Pixi canvas otherwise). Left-handed reverses
  // the fret columns and moves the nut border to the opposite side.
  const displayFrets = handedness === 'left' ? [...frets].reverse() : frets;
  const fallbackGrid = (
    <div className="overflow-x-auto">
      <table className="border-collapse text-center text-[11px]">
        <thead>
          <tr>
            <th className="w-6" />
            {displayFrets.map((f) => (
              <th key={f} className="w-10 pb-1 font-normal text-muted-foreground">
                {f}
                {FRET_MARKERS.has(f) ? <span className="block leading-none">•</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STANDARD_TUNING.map((open, stringIndex) => (
            <tr key={`${STANDARD_TUNING_NAMES[stringIndex]}-${open}`}>
              <th className="pr-1 text-right font-mono text-muted-foreground">
                {STANDARD_TUNING_NAMES[stringIndex]}
              </th>
              {displayFrets.map((f) => {
                const midi = open + f;
                const pc = midi % 12;
                const inScale = highlighted.has(pc);
                const isRoot = root !== null && pc === root;
                return (
                  <td
                    key={f}
                    className={cn(
                      'h-8 border border-border',
                      f === 0 &&
                        (handedness === 'left'
                          ? 'border-l-2 border-l-muted-foreground'
                          : 'border-r-2 border-r-muted-foreground'),
                    )}
                  >
                    <button
                      type="button"
                      aria-label={noteLabel(midi, flats)}
                      aria-pressed={active.has(midi)}
                      onClick={() => play(midi)}
                      style={
                        colorNotes
                          ? { backgroundColor: noteColorHex(pc), color: noteTextColorHex(pc) }
                          : undefined
                      }
                      className={cn(
                        'flex h-full w-full items-center justify-center',
                        colorNotes
                          ? isRoot && 'font-semibold ring-1 ring-inset ring-foreground'
                          : isRoot
                            ? 'bg-primary font-semibold text-primary-foreground'
                            : inScale
                              ? 'bg-accent/30 text-foreground'
                              : 'hover:bg-muted',
                        active.has(midi) && 'ring-2 ring-inset ring-ring',
                      )}
                    >
                      {showLabels || inScale ? pitchName(pc, flats) : ''}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!ready) return <InstrumentLoading />;

  return (
    <ToolStage
      enterLabel={t(locale, 'tool.fullscreen.enter')}
      exitLabel={t(locale, 'tool.fullscreen.exit')}
      showFullscreen={customization}
      toolbar={
        customization ? (
          <InstrumentControls
            locale={locale}
            instrument="fretboard"
            skin={skin.id}
            onSkinChange={(id) => update({ fretboardSkin: id })}
            handedness={handedness}
            onHandednessChange={(h) => update({ handedness: h })}
          />
        ) : undefined
      }
    >
      {({ isFullscreen }) => (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <InstrumentPicker value={instrument} onChange={setInstrument} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              Show note names
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={colorNotes}
                onChange={(e) => setColorNotes(e.target.checked)}
              />
              Colour notes
            </label>
            <label className="space-y-1 text-sm">
              <span className="block font-medium" data-help="scales">
                Highlight scale
              </span>
              <div className="flex gap-2">
                <Select
                  value={root ?? ''}
                  onChange={(e) => setRoot(e.target.value === '' ? null : Number(e.target.value))}
                  className="h-auto w-auto px-2 py-1"
                >
                  <option value="">— root —</option>
                  {ROOT_CHOICES.map((pc) => (
                    <option key={pc} value={pc}>
                      {pitchName(pc)}
                    </option>
                  ))}
                </Select>
                <Select
                  value={scaleKey}
                  onChange={(e) => setScaleKey(e.target.value)}
                  className="h-auto w-auto px-2 py-1"
                >
                  {scaleChoices.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
            </label>
            <LevelToggle level={level} onChange={setLevel} />
            <div className="ml-auto text-sm text-muted-foreground">
              Last note: <span className="font-mono text-foreground">{lastNote ?? '—'}</span>
            </div>
          </div>

          <PixiCanvas
            ariaLabel="Guitar fretboard — standard tuning, 15 frets"
            loader={() => import('@TheY2T/tmr-music-core/pixi/fretboard-scene')}
            sceneProps={{
              tuning: STANDARD_TUNING,
              tuningNames: STANDARD_TUNING_NAMES,
              fretCount: FRET_COUNT,
              fretMarkers: FRET_MARKERS,
              highlighted,
              root,
              active,
              showLabels,
              flats,
              handedness,
              skin: skin.palette ?? null,
              gloss: skin.effects?.gloss,
              woodGrain: skin.effects?.woodGrain,
              colorNotes,
              onPlay: strumStart,
              onGlide: strumOver,
              onRelease: strumEnd,
            }}
            containerClassName={cn(
              'rounded-lg border border-border bg-muted',
              isFullscreen ? 'h-[70vh]' : 'h-40',
            )}
            fallback={fallbackGrid}
          />

          {colorNotes && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {ROOT_CHOICES.map((pc) => (
                <span key={pc} className="inline-flex items-center gap-1.5 text-xs">
                  <span
                    className="inline-block size-3 rounded-full border border-border"
                    style={{ backgroundColor: noteColorHex(pc) }}
                  />
                  {pitchName(pc)}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Standard tuning (EADGBE). Click a fret to hear it, or drag across the strings to strum
            (drag along a string to slide). Pick a root + scale to see its shapes, or turn on Colour
            notes to see every note by colour (A red, B blue, …).
          </p>
        </div>
      )}
    </ToolStage>
  );
}
