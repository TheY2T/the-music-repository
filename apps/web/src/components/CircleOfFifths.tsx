import { useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  CIRCLE_OF_FIFTHS,
  describeAccidentals,
  diatonicChords,
  midiToFrequency,
} from '@/lib/music-theory';

const CENTER = 160;
const OUTER_R = 122;
const INNER_R = 76;

function position(index: number, radius: number): { x: number; y: number } {
  const angle = ((index * 30 - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

export default function CircleOfFifths() {
  const [selected, setSelected] = useState(0);
  const entry = CIRCLE_OF_FIFTHS[selected];
  const flats = entry.accidentals < 0;
  const chords = diatonicChords(entry.pitchClass, flats);

  function select(index: number) {
    setSelected(index);
    playTone(midiToFrequency(60 + CIRCLE_OF_FIFTHS[index].pitchClass));
  }

  return (
    <div className="grid gap-8 md:grid-cols-[320px_1fr]">
      <svg
        viewBox="0 0 320 320"
        className="mx-auto w-full max-w-[320px]"
        role="img"
        aria-label="Circle of fifths"
      >
        <circle cx={CENTER} cy={CENTER} r={OUTER_R + 18} className="fill-none stroke-border" />
        <circle cx={CENTER} cy={CENTER} r={INNER_R - 18} className="fill-none stroke-border" />
        {CIRCLE_OF_FIFTHS.map((item, index) => {
          const outer = position(index, OUTER_R);
          const inner = position(index, INNER_R);
          const isSelected = index === selected;
          return (
            // biome-ignore lint/a11y/useSemanticElements: SVG group — a <button> is not valid inside <svg>.
            <g
              key={item.major}
              onClick={() => select(index)}
              className="cursor-pointer"
              role="button"
              aria-label={`${item.major} major`}
            >
              <circle
                cx={outer.x}
                cy={outer.y}
                r={22}
                className={
                  isSelected ? 'fill-blue-500 stroke-blue-600' : 'fill-background stroke-border'
                }
              />
              <text
                x={outer.x}
                y={outer.y + 4}
                textAnchor="middle"
                className={`text-sm font-semibold ${isSelected ? 'fill-white' : 'fill-foreground'}`}
              >
                {item.major}
              </text>
              <text
                x={inner.x}
                y={inner.y + 3}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {item.relativeMinor}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{entry.major} major</h2>
          <p className="text-muted-foreground">
            Key signature: {describeAccidentals(entry.accidentals)} · relative minor{' '}
            <span className="font-medium text-foreground">{entry.relativeMinor}</span>
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold" data-help="chords">
            Diatonic chords
          </h3>
          <div className="flex flex-wrap gap-2">
            {chords.map((chord) => (
              <div
                key={chord.roman}
                className="rounded-md border border-border px-3 py-1.5 text-center"
              >
                <div className="text-xs text-muted-foreground">{chord.roman}</div>
                <div className="font-medium">{chord.name}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Click a key to hear its tonic. Neighbours on the circle share all but one note — the
          closest key changes.
        </p>
      </div>
    </div>
  );
}
