import { Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import {
  FRET_MARKERS,
  pitchName,
  ROOT_CHOICES,
  SCALES,
  STANDARD_TUNING,
  scalePitchClasses,
} from '@/lib/music-theory';
import { playNote } from '@/lib/soundfont';

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
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
        <div className="inline-block rounded-lg border border-border bg-neutral-100 p-2 dark:bg-neutral-900">
          {/* Fret number row */}
          <div className="flex">
            <div className="w-6" />
            {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
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
              {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
                const midi = open + fret;
                const pc = midi % 12;
                const on = pitches.has(pc) && inWindow(fret);
                const isRoot = pc === root;
                return (
                  <button
                    type="button"
                    key={`f${fret}`}
                    onClick={() => playNote(midi)}
                    className={`m-[1px] flex h-6 w-8 items-center justify-center rounded-sm border text-[10px] ${
                      fret === 0 ? 'border-r-2 border-r-neutral-400' : 'border-transparent'
                    } ${
                      on
                        ? isRoot
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-300 text-blue-950'
                        : 'text-neutral-300 dark:text-neutral-700'
                    }`}
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
        {pitchName(root, flats)} {scale.name} — roots in dark blue. Slide the position to see the
        scale as a movable box (or show the whole neck). Click a note to hear it.
      </p>
    </div>
  );
}
