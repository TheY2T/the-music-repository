import { ledgerSteps } from '@TheY2T/tmr-music-core/staff-geometry';

const BASE_Y = 108; // bottom staff line (E4, step 0)
const HALF = 8;
const START_X = 70;
const SPACING = 40;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];
const stepY = (step: number) => BASE_Y - step * HALF;

export interface StaffNoteDatum {
  step: number;
  label: string;
  /** Accidental glyph drawn left of the note head, or '' / undefined for a natural. */
  accidental?: '' | '♯' | '♭';
  /** Duration in beats (quarter = 1). When set, the note-value glyph (head/stem/flag/dot) is drawn. */
  beats?: number;
  /** When true, draw a rest glyph (silent) instead of a note head. */
  rest?: boolean;
}

const STEM_LEN = 34;
const DOTTED = new Set([0.75, 1.5, 3]);

export interface StaffSequenceProps {
  notes: StaffNoteDatum[];
  showLabels?: boolean;
  /** Index of the currently-sounding note to highlight (with a cursor). -1 for none. */
  activeIndex?: number;
}

/** A row of notes on a treble staff (clef + ledger lines). Reused by sight-reading + note tools. */
export function StaffSequence({ notes, showLabels = false, activeIndex = -1 }: StaffSequenceProps) {
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
          if (note.rest) {
            const fillInk = active ? 'fill-blue-600' : 'fill-foreground';
            const strokeInk = active ? 'stroke-blue-600' : 'stroke-foreground';
            const beats = note.beats ?? 1;
            return (
              <g key={`rest-${index}`}>
                {active ? (
                  <rect
                    x={x - SPACING / 2}
                    y={4}
                    width={SPACING}
                    height={142}
                    className="fill-blue-500/15"
                  />
                ) : null}
                {beats >= 2 ? (
                  // Half rest: a filled bar sitting on the middle line.
                  <rect x={x - 8} y={stepY(4) - 6} width={16} height={5.5} className={fillInk} />
                ) : beats <= 0.5 ? (
                  // Eighth rest: a blob with a downward stroke.
                  <>
                    <circle cx={x - 1} cy={stepY(4.5)} r={2.8} className={fillInk} />
                    <line
                      x1={x + 1}
                      x2={x - 4}
                      y1={stepY(4.5)}
                      y2={stepY(2)}
                      className={strokeInk}
                      strokeWidth={2}
                    />
                  </>
                ) : (
                  // Quarter rest: a jagged squiggle.
                  <path
                    d={`M ${x - 3} ${stepY(6.2)} L ${x + 3} ${stepY(5.2)} L ${x - 3} ${stepY(3.8)} L ${x + 3} ${stepY(2.8)} Q ${x - 4} ${stepY(2.2)} ${x + 2} ${stepY(1)}`}
                    className={`fill-none ${strokeInk}`}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {DOTTED.has(beats) ? (
                  <circle cx={x + 12} cy={stepY(4)} r={2} className={fillInk} />
                ) : null}
              </g>
            );
          }
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
              {note.accidental ? (
                <text
                  x={x - 14}
                  y={stepY(note.step) + 5}
                  textAnchor="middle"
                  className={active ? 'fill-blue-600' : 'fill-foreground'}
                  fontSize={18}
                >
                  {note.accidental}
                </text>
              ) : null}
              {(() => {
                const y = stepY(note.step);
                const beats = note.beats;
                const fillClass = active ? 'fill-blue-600' : 'fill-foreground';
                const strokeClass = active ? 'stroke-blue-600' : 'stroke-foreground';
                const open = beats !== undefined && beats >= 2;
                const showStem = beats !== undefined && beats < 4;
                const flag = beats !== undefined && beats <= 0.5;
                const dotted = beats !== undefined && DOTTED.has(beats);
                const stemUp = note.step <= 4;
                const stemX = x + (stemUp ? 7 : -7);
                const stemTip = y + (stemUp ? -STEM_LEN : STEM_LEN);
                return (
                  <>
                    <ellipse
                      cx={x}
                      cy={y}
                      rx={7.5}
                      ry={5.5}
                      className={open ? `fill-transparent ${strokeClass}` : fillClass}
                      strokeWidth={open ? 2 : 0}
                    />
                    {showStem ? (
                      <line
                        x1={stemX}
                        x2={stemX}
                        y1={y}
                        y2={stemTip}
                        className={strokeClass}
                        strokeWidth={2}
                      />
                    ) : null}
                    {flag ? (
                      <path
                        d={
                          stemUp
                            ? `M ${stemX} ${stemTip} q 11 6 6 18`
                            : `M ${stemX} ${stemTip} q 11 -6 6 -18`
                        }
                        className={`fill-none ${strokeClass}`}
                        strokeWidth={2.5}
                      />
                    ) : null}
                    {dotted ? <circle cx={x + 13} cy={y - 3} r={2} className={fillClass} /> : null}
                  </>
                );
              })()}
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

export default StaffSequence;
