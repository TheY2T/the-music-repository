// Chord-diagram data + pure SVG renderer (no audio). The audio strum lives in the app
// (apps/web/src/lib/guitar.ts) since sound generation is an app concern injected at the call site.

// Open-string MIDI, low-E first (diagram convention: low E on the left).
export const TUNING_LOW_FIRST = [40, 45, 50, 55, 59, 64];

export interface ChordShape {
  name: string;
  quality: 'major' | 'minor' | 'barre';
  /** Fret per string, low-E first. -1 = muted, 0 = open. */
  frets: number[];
}

export const GUITAR_CHORDS: ChordShape[] = [
  { name: 'C', quality: 'major', frets: [-1, 3, 2, 0, 1, 0] },
  { name: 'A', quality: 'major', frets: [-1, 0, 2, 2, 2, 0] },
  { name: 'G', quality: 'major', frets: [3, 2, 0, 0, 0, 3] },
  { name: 'E', quality: 'major', frets: [0, 2, 2, 1, 0, 0] },
  { name: 'D', quality: 'major', frets: [-1, -1, 0, 2, 3, 2] },
  { name: 'Am', quality: 'minor', frets: [-1, 0, 2, 2, 1, 0] },
  { name: 'Em', quality: 'minor', frets: [0, 2, 2, 0, 0, 0] },
  { name: 'Dm', quality: 'minor', frets: [-1, -1, 0, 2, 3, 1] },
  { name: 'F', quality: 'barre', frets: [1, 3, 3, 2, 1, 1] },
  { name: 'Bm', quality: 'barre', frets: [-1, 2, 4, 4, 3, 2] },
];

const LEFT = 12;
const TOP = 20;
const COL = 14;
const ROW = 16;
const FRETS = 5;
const stringX = (i: number) => LEFT + i * COL;
const fretY = (f: number) => TOP + f * ROW;
const WIDTH = LEFT * 2 + (TUNING_LOW_FIRST.length - 1) * COL;
const HEIGHT = TOP + FRETS * ROW + 16;

/** A single guitar chord shape rendered as an SVG fret grid (low E on the left). */
export function ChordDiagram({ chord }: { chord: ChordShape }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-24"
      role="img"
      aria-label={`${chord.name} chord diagram`}
    >
      {/* Fret lines (fret 0 = nut, drawn thicker). */}
      {Array.from({ length: FRETS + 1 }, (_, f) => (
        <line
          key={f}
          x1={stringX(0)}
          x2={stringX(5)}
          y1={fretY(f)}
          y2={fretY(f)}
          className="stroke-foreground"
          strokeWidth={f === 0 ? 3 : 1}
        />
      ))}
      {/* Strings. */}
      {TUNING_LOW_FIRST.map((_, i) => (
        <line
          key={stringX(i)}
          x1={stringX(i)}
          x2={stringX(i)}
          y1={fretY(0)}
          y2={fretY(FRETS)}
          className="stroke-foreground"
          strokeWidth={1}
        />
      ))}
      {/* Muted (×) / open (○) markers + fretted dots. */}
      {chord.frets.map((fret, i) => {
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
        return (
          <circle
            key={key}
            cx={stringX(i)}
            cy={fretY(fret) - ROW / 2}
            r={4.5}
            className="fill-foreground"
          />
        );
      })}
    </svg>
  );
}
