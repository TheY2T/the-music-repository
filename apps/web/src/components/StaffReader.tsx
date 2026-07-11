import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { ledgerSteps, midiToFrequency, trebleStaffNotes } from '@/lib/music-theory';

const NOTES = trebleStaffNotes();
const BASE_Y = 116; // y of the bottom staff line (E4, step 0)
const HALF = 8; // px per diatonic half-step
const START_X = 66;
const SPACING = 34;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];

const stepY = (step: number) => BASE_Y - step * HALF;
const width = START_X + NOTES.length * SPACING + 20;

export default function StaffReader() {
  const [selected, setSelected] = useState<string | null>(null);

  function play(note: (typeof NOTES)[number]) {
    playTone(midiToFrequency(note.midi));
    setSelected(note.name);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} 150`}
          className="min-w-[640px]"
          role="img"
          aria-label="Treble staff — natural notes C4 to C6"
        >
          {STAFF_LINE_STEPS.map((step) => (
            <line
              key={step}
              x1={20}
              x2={width - 10}
              y1={stepY(step)}
              y2={stepY(step)}
              className="stroke-border"
              strokeWidth={1.5}
            />
          ))}
          <text x={24} y={stepY(2) + 20} className="fill-foreground" fontSize={64}>
            𝄞
          </text>

          {NOTES.map((note, index) => {
            const x = START_X + index * SPACING;
            const y = stepY(note.step);
            const isSelected = selected === note.name;
            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG group — a <button> is not valid inside <svg>.
              <g
                key={note.name}
                onClick={() => play(note)}
                className="cursor-pointer"
                role="button"
                aria-label={note.name}
              >
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
                  cy={y}
                  rx={7.5}
                  ry={5.5}
                  className={isSelected ? 'fill-blue-500' : 'fill-foreground'}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">
        Click a note to hear it. Selected:{' '}
        <span className="font-mono text-foreground">{selected ?? '—'}</span>
      </p>
    </div>
  );
}
