import { cn, Select } from '@TheY2T/tmr-ui';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PixiCanvas } from '@/components/PixiCanvas';
import { playTone } from '@/lib/audio';
import {
  FRET_MARKERS,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
  SCALES,
  STANDARD_TUNING,
  STANDARD_TUNING_NAMES,
  scalePitchClasses,
} from '@/lib/music-theory';

const FRET_COUNT = 15;
const frets = Array.from({ length: FRET_COUNT + 1 }, (_, f) => f);

const noteLabel = (midi: number, flats: boolean) =>
  `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;

export default function GuitarFretboard() {
  const [showLabels, setShowLabels] = useState(true);
  const [root, setRoot] = useState<number | null>(null);
  const [scaleKey, setScaleKey] = useState('minor-pentatonic');
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [active, setActive] = useState<Set<number>>(new Set());
  const releaseTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const highlighted = useMemo(
    () => (root === null ? new Set<number>() : scalePitchClasses(root, scale.intervals)),
    [root, scale],
  );
  const flats = root !== null && [1, 3, 5, 8, 10].includes(root);

  const play = useCallback(
    (midi: number) => {
      playTone(midiToFrequency(midi));
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

  // Accessible, token-themed fret grid — the real control surface (visible when WebGL is
  // unavailable; operable but visually hidden behind the Pixi canvas otherwise).
  const fallbackGrid = (
    <div className="overflow-x-auto">
      <table className="border-collapse text-center text-[11px]">
        <thead>
          <tr>
            <th className="w-6" />
            {frets.map((f) => (
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
              {frets.map((f) => {
                const midi = open + f;
                const pc = midi % 12;
                const inScale = highlighted.has(pc);
                const isRoot = root !== null && pc === root;
                return (
                  <td
                    key={f}
                    className={cn(
                      'h-8 border border-border',
                      f === 0 && 'border-r-2 border-r-muted-foreground',
                    )}
                  >
                    <button
                      type="button"
                      aria-label={noteLabel(midi, flats)}
                      aria-pressed={active.has(midi)}
                      onClick={() => play(midi)}
                      className={cn(
                        'flex h-full w-full items-center justify-center',
                        isRoot
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Show note names
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
              {SCALES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          Last note: <span className="font-mono text-foreground">{lastNote ?? '—'}</span>
        </div>
      </div>

      <PixiCanvas
        ariaLabel="Guitar fretboard — standard tuning, 15 frets"
        loader={() => import('@/lib/pixi/fretboard-scene')}
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
          onPlay: play,
        }}
        containerClassName="h-40 rounded-lg border border-border bg-muted"
        fallback={fallbackGrid}
      />

      <p className="text-xs text-muted-foreground">
        Standard tuning (EADGBE). Click a fret to hear it; pick a root + scale to see its shapes
        (root notes highlighted).
      </p>
    </div>
  );
}
