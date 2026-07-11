import { useMemo, useState } from 'react';
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

export default function GuitarFretboard() {
  const [showLabels, setShowLabels] = useState(true);
  const [root, setRoot] = useState<number | null>(null);
  const [scaleKey, setScaleKey] = useState('minor-pentatonic');
  const [lastNote, setLastNote] = useState<string | null>(null);

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const highlighted = useMemo(
    () => (root === null ? new Set<number>() : scalePitchClasses(root, scale.intervals)),
    [root, scale],
  );
  const flats = root !== null && [1, 3, 5, 8, 10].includes(root);

  function play(midi: number) {
    playTone(midiToFrequency(midi));
    setLastNote(`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`);
  }

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
            <select
              value={root ?? ''}
              onChange={(e) => setRoot(e.target.value === '' ? null : Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">— root —</option>
              {ROOT_CHOICES.map((pc) => (
                <option key={pc} value={pc}>
                  {pitchName(pc)}
                </option>
              ))}
            </select>
            <select
              value={scaleKey}
              onChange={(e) => setScaleKey(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {SCALES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          Last note: <span className="font-mono text-foreground">{lastNote ?? '—'}</span>
        </div>
      </div>

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
                      className={`h-8 border border-neutral-300 ${f === 0 ? 'border-r-2 border-r-neutral-500' : ''}`}
                    >
                      <button
                        type="button"
                        aria-label={`${pitchName(pc, flats)}${Math.floor(midi / 12) - 1}`}
                        onClick={() => play(midi)}
                        className={`flex h-full w-full items-center justify-center ${
                          isRoot
                            ? 'bg-blue-600 font-semibold text-white'
                            : inScale
                              ? 'bg-blue-200 text-blue-900'
                              : 'hover:bg-muted'
                        }`}
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
      <p className="text-xs text-muted-foreground">
        Standard tuning (EADGBE). Click a fret to hear it; pick a root + scale to see its shapes
        (root notes in dark blue).
      </p>
    </div>
  );
}
