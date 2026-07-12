import { Button, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { playTone } from '@/lib/audio';
import { diatonicChords, midiToFrequency } from '@/lib/music-theory';

// Progressions as diatonic-degree indices (0 = I … 6 = vii°) in a major key.
const PROGRESSIONS = [
  { key: 'axis', label: 'I–V–vi–IV', degrees: [0, 4, 5, 3] },
  { key: 'fifties', label: 'I–vi–IV–V', degrees: [0, 5, 3, 4] },
  { key: 'twofive', label: 'ii–V–I', degrees: [1, 4, 0] },
  { key: 'plagal', label: 'I–IV–V', degrees: [0, 3, 4] },
];

// Fixed key of C for the quiz.
const CHORDS = diatonicChords(0, false);

function playProgression(degrees: number[]) {
  degrees.forEach((degree, i) => {
    window.setTimeout(() => {
      for (const pc of CHORDS[degree].pitchClasses) {
        playTone(midiToFrequency(48 + pc), 0.75);
      }
    }, i * 750);
  });
}

function randomIndex(exclude: number, length: number): number {
  let next = Math.floor(Math.random() * length);
  if (next === exclude) {
    next = (next + 1) % length;
  }
  return next;
}

export default function ProgressionEar() {
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Play the progression whenever a new one is chosen.
  useEffect(() => {
    playProgression(PROGRESSIONS[current].degrees);
  }, [current]);

  function guess(index: number) {
    if (answered !== null) {
      return;
    }
    setAnswered(index);
    setScore((s) => ({ correct: s.correct + (index === current ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setAnswered(null);
    setCurrent((c) => randomIndex(c, PROGRESSIONS.length));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Button type="button" onClick={() => playProgression(PROGRESSIONS[current].degrees)}>
          <Icon name="play" className="size-4" />
          Replay
        </Button>
        <span className="text-sm text-muted-foreground">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PROGRESSIONS.map((prog, i) => {
          const isAnswer = i === current;
          const isChosen = i === answered;
          const state =
            answered === null ? 'idle' : isAnswer ? 'correct' : isChosen ? 'wrong' : 'idle';
          return (
            <button
              key={prog.key}
              type="button"
              onClick={() => guess(i)}
              disabled={answered !== null}
              className={`rounded-lg border p-3 text-sm font-semibold transition-colors ${
                state === 'correct'
                  ? 'border-green-600 bg-green-600/15'
                  : state === 'wrong'
                    ? 'border-red-600 bg-red-600/15'
                    : 'border-border hover:bg-muted'
              }`}
              data-help="chords"
            >
              {prog.label}
            </button>
          );
        })}
      </div>

      {answered !== null ? (
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            {answered === current ? (
              <>
                <Icon name="check" className="size-4" />
                Correct!
              </>
            ) : (
              <>
                <Icon name="x" className="size-4" />
                It was {PROGRESSIONS[current].label}
              </>
            )}
          </span>
          <Button type="button" variant="outline" onClick={next}>
            Next
            <Icon name="arrow-right" className="size-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Listen, then pick the progression you heard.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Progressions are played in C major (block triads). Train your ear to recognise the common
        moves that power most songs.
      </p>
    </div>
  );
}
