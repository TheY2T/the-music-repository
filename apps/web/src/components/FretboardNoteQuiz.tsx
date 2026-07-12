import { Button } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  FRET_MARKERS,
  midiToFrequency,
  pitchName,
  SHARP_NAMES,
  STANDARD_TUNING,
  STANDARD_TUNING_NAMES,
} from '@/lib/music-theory';

const FRET_COUNT = 12;

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

interface Target {
  string: number;
  fret: number;
}

function randomTarget(): Target {
  return { string: randomInt(STANDARD_TUNING.length), fret: randomInt(FRET_COUNT + 1) };
}

export default function FretboardNoteQuiz() {
  const [target, setTarget] = useState<Target>({ string: 0, fret: 0 });
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Pick the first target on mount (avoids Math.random during SSR).
  useEffect(() => {
    setTarget(randomTarget());
  }, []);

  const targetMidi = STANDARD_TUNING[target.string] + target.fret;
  const targetPc = targetMidi % 12;

  function guess(pc: number) {
    if (answered !== null) {
      return;
    }
    setAnswered(pc);
    setScore((s) => ({ correct: s.correct + (pc === targetPc ? 1 : 0), total: s.total + 1 }));
    playTone(midiToFrequency(targetMidi));
  }

  function next() {
    setAnswered(null);
    setTarget(randomTarget());
  }

  return (
    <div className="space-y-5">
      <span className="text-sm text-muted-foreground">
        Score: {score.correct}/{score.total}
      </span>

      <div className="overflow-x-auto">
        <div className="inline-block rounded-lg border border-border bg-neutral-100 p-2 dark:bg-neutral-900">
          <div className="flex">
            <div className="w-6" />
            {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
              <div
                key={fret}
                className="w-9 text-center text-[10px] text-muted-foreground tabular-nums"
              >
                {FRET_MARKERS.has(fret) ? fret : ''}
              </div>
            ))}
          </div>
          {STANDARD_TUNING.map((open, stringIdx) => (
            <div key={open} className="flex items-center">
              <div className="w-6 text-center text-xs text-muted-foreground">
                {STANDARD_TUNING_NAMES[stringIdx]}
              </div>
              {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
                const isTarget = stringIdx === target.string && fret === target.fret;
                return (
                  <div
                    key={`f${fret}`}
                    className={`m-[1px] flex h-7 w-9 items-center justify-center rounded-sm border text-xs font-semibold ${
                      fret === 0 ? 'border-r-2 border-r-neutral-400' : 'border-transparent'
                    } ${
                      isTarget
                        ? answered === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-600 text-white'
                        : ''
                    }`}
                  >
                    {isTarget ? (answered === null ? '?' : pitchName(targetPc)) : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SHARP_NAMES.map((name, pc) => {
          const state =
            answered === null
              ? 'idle'
              : pc === targetPc
                ? 'correct'
                : pc === answered
                  ? 'wrong'
                  : 'idle';
          return (
            <button
              key={name}
              type="button"
              onClick={() => guess(pc)}
              disabled={answered !== null}
              className={`w-12 rounded-md border py-2 text-sm font-semibold transition-colors ${
                state === 'correct'
                  ? 'border-green-600 bg-green-600/15'
                  : state === 'wrong'
                    ? 'border-red-600 bg-red-600/15'
                    : 'border-border hover:bg-muted'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {answered !== null ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {answered === targetPc ? '✓ Correct!' : `✗ It was ${pitchName(targetPc)}`}
          </span>
          <Button type="button" variant="outline" onClick={next}>
            Next →
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" data-help="fretboard">
          Name the highlighted note on the fretboard.
        </p>
      )}
    </div>
  );
}
