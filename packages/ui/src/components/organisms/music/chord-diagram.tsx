// Chord-diagram data + pure SVG renderer (no audio). The audio strum lives in the app
// (apps/web/src/lib/guitar.ts) since sound generation is an app concern injected at the call site.

// Open-string MIDI, low-E first (diagram convention: low E on the left).
export const TUNING_LOW_FIRST = [40, 45, 50, 55, 59, 64];
// Standard (reentrant) ukulele, g-C-E-A shown left→right on the diagram.
export const UKULELE_TUNING_LOW_FIRST = [67, 60, 64, 69];

export interface ChordShape {
  name: string;
  quality: 'major' | 'minor' | 'barre' | 'dominant';
  /** Fret per string, low string first. -1 = muted, 0 = open. Length = number of strings. */
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
  // Open dominant sevenths (blues / turnarounds).
  { name: 'A7', quality: 'dominant', frets: [-1, 0, 2, 0, 2, 0] },
  { name: 'D7', quality: 'dominant', frets: [-1, -1, 0, 2, 1, 2] },
  { name: 'E7', quality: 'dominant', frets: [0, 2, 0, 1, 0, 0] },
  { name: 'C7', quality: 'dominant', frets: [-1, 3, 2, 3, 1, 0] },
  { name: 'G7', quality: 'dominant', frets: [3, 2, 0, 0, 0, 1] },
  { name: 'B7', quality: 'dominant', frets: [-1, 2, 1, 2, 0, 2] },
];

// Standard C-tuning ukulele open shapes (frets low-string-first: g, C, E, A).
export const UKULELE_CHORDS: ChordShape[] = [
  { name: 'C', quality: 'major', frets: [0, 0, 0, 3] },
  { name: 'G', quality: 'major', frets: [0, 2, 3, 2] },
  { name: 'F', quality: 'major', frets: [2, 0, 1, 0] },
  { name: 'D', quality: 'major', frets: [2, 2, 2, 0] },
  { name: 'A', quality: 'major', frets: [2, 1, 0, 0] },
  { name: 'Am', quality: 'minor', frets: [2, 0, 0, 0] },
  { name: 'Em', quality: 'minor', frets: [0, 4, 3, 2] },
  { name: 'Dm', quality: 'minor', frets: [2, 2, 1, 0] },
  { name: 'C7', quality: 'dominant', frets: [0, 0, 0, 1] },
  { name: 'G7', quality: 'dominant', frets: [0, 2, 1, 2] },
  { name: 'D7', quality: 'dominant', frets: [2, 2, 3, 3] },
];

const LEFT = 12;
const TOP = 20;
const COL = 14;
const ROW = 16;
const FRETS = 5;
const stringX = (i: number) => LEFT + i * COL;
const fretY = (f: number) => TOP + f * ROW;
const HEIGHT = TOP + FRETS * ROW + 16;

/** A single fretted-chord shape rendered as an SVG fret grid (low string on the left). String count
 * is taken from `chord.frets.length`, so it renders 6-string guitar and 4-string ukulele alike. */
export function ChordDiagram({ chord }: { chord: ChordShape }) {
  const strings = chord.frets.length;
  const width = LEFT * 2 + (strings - 1) * COL;
  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      className="w-24"
      role="img"
      aria-label={`${chord.name} chord diagram`}
    >
      {/* Fret lines (fret 0 = nut, drawn thicker). */}
      {Array.from({ length: FRETS + 1 }, (_, f) => (
        <line
          key={f}
          x1={stringX(0)}
          x2={stringX(strings - 1)}
          y1={fretY(f)}
          y2={fretY(f)}
          className="stroke-foreground"
          strokeWidth={f === 0 ? 3 : 1}
        />
      ))}
      {/* Strings. */}
      {chord.frets.map((_, i) => (
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
