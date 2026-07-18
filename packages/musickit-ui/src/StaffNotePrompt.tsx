import { ledgerSteps } from '@TheY2T/tmr-music-core/music-theory';

const BASE_Y = 96; // bottom staff line (E4, step 0)
const HALF = 8;
const X = 120;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];
const stepY = (step: number) => BASE_Y - step * HALF;

/** A single note on a small treble staff — the visual prompt for the note-reading drill. */
export default function StaffNotePrompt({ step }: { step: number }) {
  return (
    <svg
      viewBox="0 -20 200 150"
      className="mx-auto h-44"
      role="img"
      aria-label="A note on the staff"
    >
      {STAFF_LINE_STEPS.map((line) => (
        <line
          key={line}
          x1={20}
          x2={180}
          y1={stepY(line)}
          y2={stepY(line)}
          className="stroke-border"
          strokeWidth={1.5}
        />
      ))}
      <text x={26} y={stepY(2) + 20} className="fill-foreground" fontSize={64}>
        𝄞
      </text>
      {ledgerSteps(step).map((ledger) => (
        <line
          key={ledger}
          x1={X - 12}
          x2={X + 12}
          y1={stepY(ledger)}
          y2={stepY(ledger)}
          className="stroke-border"
          strokeWidth={1.5}
        />
      ))}
      <ellipse cx={X} cy={stepY(step)} rx={8} ry={6} className="fill-foreground" />
    </svg>
  );
}
