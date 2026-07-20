import { useToolInstrument } from '@TheY2T/tmr-music-core/instrument-choice';
import {
  FRET_MARKERS,
  pitchName,
  ROOT_CHOICES,
  SCALES,
  STANDARD_TUNING,
  scalePitchClasses,
} from '@TheY2T/tmr-music-core/music-theory';
import { playNote } from '@TheY2T/tmr-music-core/soundfont';
import { cn, Select } from '@TheY2T/tmr-ui';
import { useInstrumentPreferences } from '@TheY2T/tmr-web-acl/instrument-preferences';
import { useState } from 'react';
import InstrumentLoading from './InstrumentLoading';
import InstrumentPicker from './InstrumentPicker';

const FRET_COUNT = 15;
const BOX_WIDTH = 4; // frets spanned by a position box
// STANDARD_TUNING is high-e first; render high e at the top.

/** Props let a catalogue embed preconfigure the tool to a specific scale (defaults = the /tools page). */
export default function ScaleBoxes({
  root: initialRoot = 9, // A
  scale: initialScale = 'minor-pentatonic',
  position: initialPosition = 5,
}: {
  root?: number;
  scale?: string;
  position?: number;
} = {}) {
  const [root, setRoot] = useState(initialRoot);
  const [scaleKey, setScaleKey] = useState(initialScale);
  const [position, setPosition] = useState(initialPosition);
  const [showAll, setShowAll] = useState(false);

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const pitches = scalePitchClasses(root, scale.intervals);
  const flats = [1, 3, 5, 8, 10].includes(root);

  const inWindow = (fret: number) => showAll || (fret >= position && fret <= position + BOX_WIDTH);

  const { preferences } = useInstrumentPreferences();
  const leftHanded = preferences.handedness === 'left';
  const fretOrder = Array.from({ length: FRET_COUNT + 1 }, (_, fret) => fret);
  const displayFrets = leftHanded ? [...fretOrder].reverse() : fretOrder;

  const { instrument, setInstrument, ready } = useToolInstrument('guitar');
  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <InstrumentPicker value={instrument} onChange={setInstrument} />
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Root</span>
          <Select
            value={root}
            onChange={(e) => setRoot(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {ROOT_CHOICES.map((pc) => (
              <option key={pc} value={pc}>
                {pitchName(pc)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="scales">
            Scale
          </span>
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
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Position (fret {position})</span>
          <input
            type="range"
            min={0}
            max={FRET_COUNT - BOX_WIDTH}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            className="w-40"
            disabled={showAll}
            aria-label="Position start fret"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Whole neck
        </label>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block rounded-lg border border-border bg-muted p-2">
          {/* Fret number row */}
          <div className="flex">
            <div className="w-6" />
            {displayFrets.map((fret) => (
              <div
                key={fret}
                className="w-8 text-center text-[10px] text-muted-foreground tabular-nums"
              >
                {FRET_MARKERS.has(fret) ? fret : ''}
              </div>
            ))}
          </div>
          {STANDARD_TUNING.map((open) => (
            <div key={open} className="flex items-center">
              <div className="w-6 text-center text-xs text-muted-foreground">
                {pitchName(open % 12, flats)}
              </div>
              {displayFrets.map((fret) => {
                const midi = open + fret;
                const pc = midi % 12;
                const on = pitches.has(pc) && inWindow(fret);
                const isRoot = pc === root;
                return (
                  <button
                    type="button"
                    key={`f${fret}`}
                    onClick={() => playNote(midi)}
                    className={cn(
                      'm-[1px] flex h-6 w-8 items-center justify-center rounded-sm border text-[10px]',
                      fret === 0
                        ? leftHanded
                          ? 'border-l-2 border-l-muted-foreground'
                          : 'border-r-2 border-r-muted-foreground'
                        : 'border-transparent',
                      on
                        ? isRoot
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent/40 text-foreground'
                        : 'text-muted-foreground/40',
                    )}
                  >
                    {on ? pitchName(pc, flats) : '·'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {pitchName(root, flats)} {scale.name} — root notes highlighted. Slide the position to see
        the scale as a movable box (or show the whole neck). Click a note to hear it.
      </p>
    </div>
  );
}
