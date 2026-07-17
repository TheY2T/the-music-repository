// Pure SVG chord-diagram renderer (no audio). The chord-shape DATA lives in
// `@TheY2T/tmr-music-core/chord-shapes`; the audio strum lives in the app since sound generation is
// injected at the call site.
import type { ChordShape } from '@TheY2T/tmr-music-core/chord-shapes';

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
  // Window the neck: baseFret 1 shows the nut (frets 1–5); >1 shows a movable shape higher up and
  // labels its starting fret. `displayFret` maps an absolute fret into the current 1–5 window.
  const baseFret = chord.baseFret && chord.baseFret > 1 ? chord.baseFret : 1;
  const atNut = baseFret === 1;
  const displayFret = (f: number) => f - baseFret + 1;
  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      className="w-24"
      role="img"
      aria-label={`${chord.name} chord diagram`}
    >
      {/* Fret lines (at the nut, fret 0 is drawn thicker; movable shapes show a position label instead). */}
      {Array.from({ length: FRETS + 1 }, (_, f) => (
        <line
          key={f}
          x1={stringX(0)}
          x2={stringX(strings - 1)}
          y1={fretY(f)}
          y2={fretY(f)}
          className="stroke-foreground"
          strokeWidth={atNut && f === 0 ? 3 : 1}
        />
      ))}
      {!atNut && (
        <text
          x={stringX(0) - 5}
          y={fretY(1) - ROW / 2 + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[8px]"
        >
          {baseFret}fr
        </text>
      )}
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
            cy={fretY(displayFret(fret)) - ROW / 2}
            r={4.5}
            className="fill-foreground"
          />
        );
      })}
    </svg>
  );
}
