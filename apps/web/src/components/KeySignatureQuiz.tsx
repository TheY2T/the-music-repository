import { useState } from 'react';
import { CIRCLE_OF_FIFTHS, describeAccidentals } from '@/lib/music-theory';

const SHARP_ORDER = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'];
const FLAT_ORDER = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'];

function accidentalNames(accidentals: number): string {
  if (accidentals === 0) {
    return '';
  }
  const count = Math.abs(accidentals);
  return (accidentals > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, count).join(' ');
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Round {
  answer: string;
  accidentals: number;
  options: string[];
}

function makeRound(): Round {
  const entry = CIRCLE_OF_FIFTHS[Math.floor(Math.random() * CIRCLE_OF_FIFTHS.length)];
  const distractors = shuffle(
    CIRCLE_OF_FIFTHS.map((e) => e.major).filter((m) => m !== entry.major),
  ).slice(0, 3);
  return {
    answer: entry.major,
    accidentals: entry.accidentals,
    options: shuffle([entry.major, ...distractors]),
  };
}

export default function KeySignatureQuiz() {
  const [round, setRound] = useState<Round>(makeRound);
  const [answered, setAnswered] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function guess(option: string) {
    if (answered !== null) {
      return;
    }
    setAnswered(option);
    setScore((s) => ({
      correct: s.correct + (option === round.answer ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setRound(makeRound());
    setAnswered(null);
  }

  const names = accidentalNames(round.accidentals);

  return (
    <div className="space-y-5">
      <span className="text-sm text-muted-foreground">
        Score: {score.correct}/{score.total}
      </span>

      <div className="rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">This key signature has</p>
        <p className="my-1 text-2xl font-bold">{describeAccidentals(round.accidentals)}</p>
        {names ? <p className="font-mono text-lg">{names}</p> : null}
        <p className="mt-2 text-sm text-muted-foreground">Which major key is it?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {round.options.map((option) => {
          const state =
            answered === null
              ? 'idle'
              : option === round.answer
                ? 'correct'
                : option === answered
                  ? 'wrong'
                  : 'idle';
          return (
            <button
              key={option}
              type="button"
              onClick={() => guess(option)}
              disabled={answered !== null}
              data-help="scales"
              className={`rounded-lg border p-3 text-lg font-semibold transition-colors ${
                state === 'correct'
                  ? 'border-green-600 bg-green-600/15'
                  : state === 'wrong'
                    ? 'border-red-600 bg-red-600/15'
                    : 'border-border hover:bg-muted'
              }`}
            >
              {option} major
            </button>
          );
        })}
      </div>

      {answered !== null ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {answered === round.answer ? '✓ Correct!' : `✗ It was ${round.answer} major`}
          </span>
          <button
            type="button"
            onClick={next}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            Next →
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Name the major key from its signature.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Sharps are added in the order F C G D A E B; flats in the reverse, B E A D G C F.
      </p>
    </div>
  );
}
