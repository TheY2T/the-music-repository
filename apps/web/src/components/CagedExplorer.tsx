import { useState } from 'react';
import { TUNING_LOW_FIRST } from '@/components/ChordDiagrams';
import { playTone } from '@/lib/audio';
import { midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

// The five CAGED shapes for a C major chord (low-E first). Each is a movable shape; transposing to
// another root shifts every fretted note by the same number of semitones.
const CAGED_C: { shape: string; frets: number[] }[] = [
  { shape: 'C', frets: [-1, 3, 2, 0, 1, 0] },
  { shape: 'A', frets: [-1, 3, 5, 5, 5, 3] },
  { shape: 'G', frets: [8, 7, 5, 5, 5, 8] },
  { shape: 'E', frets: [8, 10, 10, 9, 8, 8] },
  { shape: 'D', frets: [-1, -1, 10, 12, 13, 12] },
];

/** Transpose a shape up by `semitones`, folding down an octave if it climbs past the 12th fret. */
function transpose(frets: number[], semitones: number): number[] {
  let shifted = frets.map((f) => (f < 0 ? -1 : f + semitones));
  const positives = shifted.filter((f) => f > 0);
  const minPos = positives.length ? Math.min(...positives) : 0;
  if (minPos > 12) {
    shifted = shifted.map((f) => (f < 0 ? -1 : f - 12));
  }
  return shifted;
}

const LEFT = 16;
const TOP = 20;
const COL = 14;
const ROW = 16;
const ROWS = 5;
const stringX = (i: number) => LEFT + i * COL;
const rowY = (r: number) => TOP + r * ROW;
const WIDTH = LEFT * 2 + 5 * COL;
const HEIGHT = TOP + ROWS * ROW + 14;

function ShapeDiagram({ frets }: { frets: number[] }) {
  const positives = frets.filter((f) => f > 0);
  const minPos = positives.length ? Math.min(...positives) : 1;
  const hasOpen = frets.some((f) => f === 0);
  // baseFret = fret number just above the first visible row (0 → nut shown).
  const baseFret = hasOpen ? 0 : minPos - 1;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-24"
      role="img"
      aria-label="CAGED shape diagram"
    >
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <line
          key={r}
          x1={stringX(0)}
          x2={stringX(5)}
          y1={rowY(r)}
          y2={rowY(r)}
          className="stroke-foreground"
          strokeWidth={r === 0 && baseFret === 0 ? 3 : 1}
        />
      ))}
      {TUNING_LOW_FIRST.map((_, i) => (
        <line
          key={stringX(i)}
          x1={stringX(i)}
          x2={stringX(i)}
          y1={rowY(0)}
          y2={rowY(ROWS)}
          className="stroke-foreground"
          strokeWidth={1}
        />
      ))}
      {baseFret > 0 ? (
        <text x={4} y={rowY(1) - 4} className="fill-muted-foreground text-[9px]">
          {baseFret + 1}
        </text>
      ) : null}
      {frets.map((fret, i) => {
        const key = `s${i}`;
        if (fret === -1) {
          return (
            <text
              key={key}
              x={stringX(i)}
              y={TOP - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={key}
              cx={stringX(i)}
              cy={TOP - 9}
              r={3}
              className="fill-none stroke-muted-foreground"
              strokeWidth={1}
            />
          );
        }
        const row = fret - baseFret;
        if (row < 1 || row > ROWS) {
          return null;
        }
        return (
          <circle
            key={key}
            cx={stringX(i)}
            cy={rowY(row) - ROW / 2}
            r={4.5}
            className="fill-foreground"
          />
        );
      })}
    </svg>
  );
}

export default function CagedExplorer() {
  const [root, setRoot] = useState(0);
  const shapes = CAGED_C.map((s) => ({ shape: s.shape, frets: transpose(s.frets, root) }));

  function strum(frets: number[]) {
    let delay = 0;
    frets.forEach((fret, i) => {
      if (fret < 0) {
        return;
      }
      window.setTimeout(() => playTone(midiToFrequency(TUNING_LOW_FIRST[i] + fret), 1.1), delay);
      delay += 22;
    });
  }

  return (
    <div className="space-y-5">
      <label className="space-y-1 text-sm">
        <span className="block font-medium" data-help="chords">
          Root (major)
        </span>
        <select
          value={root}
          onChange={(e) => setRoot(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {ROOT_CHOICES.map((pc) => (
            <option key={pc} value={pc}>
              {pitchName(pc)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {shapes.map((s) => (
          <button
            key={s.shape}
            type="button"
            onClick={() => strum(s.frets)}
            className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
          >
            <span className="font-semibold">{s.shape} shape</span>
            <ShapeDiagram frets={s.frets} />
            <span className="text-xs text-muted-foreground">▶ Strum</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        The same {pitchName(root)} major chord in all five CAGED shapes up the neck (C–A–G–E–D). The
        number left of a diagram is its starting fret. Learn how the shapes connect to play any
        chord anywhere.
      </p>
    </div>
  );
}
