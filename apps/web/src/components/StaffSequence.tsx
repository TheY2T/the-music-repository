import { ledgerSteps } from '@/lib/music-theory';

const BASE_Y = 108; // bottom staff line (E4, step 0)
const HALF = 8;
const START_X = 70;
const SPACING = 40;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];
const stepY = (step: number) => BASE_Y - step * HALF;

export interface StaffNoteDatum {
  step: number;
  label: string;
}

/** A row of notes on a treble staff (clef + ledger lines). Reused by sight-reading + note tools. */
export default function StaffSequence({
  notes,
  showLabels = false,
  activeIndex = -1,
}: {
  notes: StaffNoteDatum[];
  showLabels?: boolean;
  /** Index of the currently-sounding note to highlight (with a cursor). -1 for none. */
  activeIndex?: number;
}) {
  const width = START_X + Math.max(notes.length, 1) * SPACING + 20;
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} 150`}
        className="min-w-[560px]"
        role="img"
        aria-label="Notes on a treble staff"
      >
        {STAFF_LINE_STEPS.map((line) => (
          <line
            key={line}
            x1={20}
            x2={width - 10}
            y1={stepY(line)}
            y2={stepY(line)}
            className="stroke-border"
            strokeWidth={1.5}
          />
        ))}
        <text x={26} y={stepY(2) + 20} className="fill-foreground" fontSize={64}>
          𝄞
        </text>
        {notes.map((note, index) => {
          const x = START_X + index * SPACING;
          const active = index === activeIndex;
          return (
            <g key={`${note.label}-${index}`}>
              {active ? (
                <rect
                  x={x - SPACING / 2}
                  y={4}
                  width={SPACING}
                  height={142}
                  className="fill-blue-500/15"
                />
              ) : null}
              {ledgerSteps(note.step).map((ledger) => (
                <line
                  key={ledger}
                  x1={x - 12}
                  x2={x + 12}
                  y1={stepY(ledger)}
                  y2={stepY(ledger)}
                  className="stroke-border"
                  strokeWidth={1.5}
                />
              ))}
              <ellipse
                cx={x}
                cy={stepY(note.step)}
                rx={7.5}
                ry={5.5}
                className={active ? 'fill-blue-600' : 'fill-foreground'}
              />
              {showLabels ? (
                <text
                  x={x}
                  y={135}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {note.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
