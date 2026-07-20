// Pure SVG chord-diagram renderer (no audio). The chord-shape DATA lives in
// `@TheY2T/tmr-music-core/chord-shapes`; the audio strum lives in the app since sound generation is
// injected at the call site.
import type { ChordShape } from '@TheY2T/tmr-music-core/chord-shapes';

const LEFT = 12;
const TOP = 20;
const COL = 14;
const ROW = 16;
const FRETS = 5;
const fretY = (f: number) => TOP + f * ROW;
const HEIGHT = TOP + FRETS * ROW + 16;

/** A single fretted-chord shape rendered as an SVG fret grid. String count is taken from
 * `chord.frets.length`, so it renders 6-string guitar and 4-string ukulele alike. Right-handed shows the
 * low string on the left; left-handed mirrors the grid horizontally (low string on the right). */
export function ChordDiagram({
  chord,
  handedness = 'right',
}: {
  chord: ChordShape;
  handedness?: 'left' | 'right';
}) {
  const strings = chord.frets.length;
  const width = LEFT * 2 + (strings - 1) * COL;
  // Map a string index to its visual column, mirroring for left-handed players.
  const stringX = (i: number) => LEFT + (handedness === 'left' ? strings - 1 - i : i) * COL;
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
          x1={LEFT}
          x2={LEFT + (strings - 1) * COL}
          y1={fretY(f)}
          y2={fretY(f)}
          className="stroke-foreground"
          strokeWidth={atNut && f === 0 ? 3 : 1}
        />
      ))}
      {!atNut &&
        (handedness === 'left' ? (
          <text
            x={LEFT + (strings - 1) * COL + 5}
            y={fretY(1) - ROW / 2 + 3}
            textAnchor="start"
            className="fill-muted-foreground text-[8px]"
          >
            {baseFret}fr
          </text>
        ) : (
          <text
            x={LEFT - 5}
            y={fretY(1) - ROW / 2 + 3}
            textAnchor="end"
            className="fill-muted-foreground text-[8px]"
          >
            {baseFret}fr
          </text>
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
      {/* Barre bars (drawn behind the dots): a rounded bar across the strings held down at that fret. */}
      {(chord.barres ?? []).map((barreFret) => {
        const held = chord.frets.flatMap((f, i) => (f === barreFret ? [i] : []));
        if (held.length < 2) return null;
        const x1 = stringX(Math.min(...held));
        const x2 = stringX(Math.max(...held));
        const y = fretY(displayFret(barreFret)) - ROW / 2;
        return (
          <rect
            key={`barre${barreFret}`}
            x={x1 - 4.5}
            y={y - 4.5}
            width={x2 - x1 + 9}
            height={9}
            rx={4.5}
            className="fill-foreground"
          />
        );
      })}
      {/* Muted (×) / open (○) markers + fretted dots (with a finger number when known). */}
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
        const cx = stringX(i);
        const cy = fretY(displayFret(fret)) - ROW / 2;
        const finger = chord.fingers?.[i] ?? 0;
        return (
          <g key={key}>
            <circle cx={cx} cy={cy} r={4.5} className="fill-foreground" />
            {finger > 0 && (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-background text-[6px] font-medium"
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
