// Pure SVG keyboard chord diagram (no audio). Highlights the chord tones of a voicing on a compact
// piano keyboard sized to the notes, labels each sounded note, and shows an optional caption (e.g. the
// inversion). The MIDI notes come from `@TheY2T/tmr-music-core/piano-voicings`; audio is injected at the
// call site.
import { pitchName } from '@TheY2T/tmr-music-core/music-theory';

const WHITE_W = 14;
const WHITE_H = 54;
const BLACK_W = 9;
const BLACK_H = 34;
const PAD = 2;
const LABEL_H = 14;

const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
const isWhite = (midi: number) => WHITE_PCS.has(((midi % 12) + 12) % 12);

/** Lowest C at or below `midi`. */
const floorToC = (midi: number) => midi - (((midi % 12) + 12) % 12);
/** Highest B at or above `midi`. */
const ceilToB = (midi: number) => {
  const pc = ((midi % 12) + 12) % 12;
  return midi + (11 - pc);
};

export interface KeyboardChordDiagramProps {
  /** MIDI notes to highlight, low → high. */
  midis: number[];
  /** Spell highlighted note names with flats instead of sharps. */
  flats?: boolean;
  /** Caption under the keyboard (e.g. "1st inversion"). */
  label?: string;
}

/**
 * A chord voicing drawn on a piano keyboard: the sounded keys are filled and named, the rest form the
 * reference octave(s). The keyboard spans whole octaves around the voicing so shapes stay comparable.
 */
export function KeyboardChordDiagram({ midis, flats = false, label }: KeyboardChordDiagramProps) {
  const sounded = new Set(midis);
  const lo = midis.length > 0 ? floorToC(Math.min(...midis)) : 60;
  const hi = midis.length > 0 ? ceilToB(Math.max(...midis)) : 71;

  // Lay keys out left→right: white keys advance the cursor; a black key sits over the seam before the
  // next white key.
  const whites: { midi: number; x: number }[] = [];
  const blacks: { midi: number; x: number }[] = [];
  let whiteIndex = 0;
  for (let midi = lo; midi <= hi; midi += 1) {
    if (isWhite(midi)) {
      whites.push({ midi, x: whiteIndex * WHITE_W });
      whiteIndex += 1;
    } else {
      blacks.push({ midi, x: whiteIndex * WHITE_W - BLACK_W / 2 });
    }
  }

  const width = whiteIndex * WHITE_W + PAD * 2;
  const noteNames = midis.map((m) => pitchName(m % 12, flats));
  const height = WHITE_H + PAD * 2 + LABEL_H * (label ? 2 : 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-40"
      role="img"
      aria-label={`Keyboard chord diagram${noteNames.length ? `: ${noteNames.join(' ')}` : ''}${label ? ` (${label})` : ''}`}
    >
      {/* White keys. */}
      {whites.map(({ midi, x }) => (
        <rect
          key={midi}
          x={x + PAD}
          y={PAD}
          width={WHITE_W}
          height={WHITE_H}
          rx={1.5}
          className={
            sounded.has(midi) ? 'fill-primary stroke-border' : 'fill-background stroke-border'
          }
        />
      ))}
      {/* Black keys, over the white-key seams. */}
      {blacks.map(({ midi, x }) => (
        <rect
          key={midi}
          x={x + PAD}
          y={PAD}
          width={BLACK_W}
          height={BLACK_H}
          rx={1.5}
          className={
            sounded.has(midi) ? 'fill-primary stroke-primary' : 'fill-foreground stroke-foreground'
          }
        />
      ))}
      {/* Sounded note names, low → high. */}
      <text
        x={width / 2}
        y={WHITE_H + PAD + 9}
        textAnchor="middle"
        className="fill-foreground text-[7px] font-medium"
      >
        {noteNames.join(' ')}
      </text>
      {label && (
        <text
          x={width / 2}
          y={WHITE_H + PAD + LABEL_H + 7}
          textAnchor="middle"
          className="fill-muted-foreground text-[7px]"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
