import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { INTERVAL_NAMES, midiToFrequency } from '@/lib/music-theory';

interface Question {
  root: number;
  semitones: number;
}

function makeQuestion(): Question {
  // Root C3–B4; any interval up to an octave.
  return { root: 48 + Math.floor(Math.random() * 24), semitones: Math.floor(Math.random() * 13) };
}

function playInterval(question: Question) {
  playTone(midiToFrequency(question.root), 0.7);
  window.setTimeout(() => playTone(midiToFrequency(question.root + question.semitones), 0.7), 550);
}

export default function EarTrainer() {
  const [question, setQuestion] = useState<Question>(makeQuestion);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [started, setStarted] = useState(false);

  function start() {
    setStarted(true);
    playInterval(question);
  }

  function guess(semitones: number) {
    if (answered !== null) {
      return;
    }
    setAnswered(semitones);
    setScore((s) => ({
      correct: s.correct + (semitones === question.semitones ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    const q = makeQuestion();
    setQuestion(q);
    setAnswered(null);
    playInterval(q);
  }

  const isCorrect = answered !== null && answered === question.semitones;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {!started ? (
          <button
            type="button"
            onClick={start}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            ▶ Start — play an interval
          </button>
        ) : (
          <button
            type="button"
            onClick={() => playInterval(question)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            ↻ Replay
          </button>
        )}
        <span className="text-sm text-muted-foreground">
          Score:{' '}
          <span className="font-mono text-foreground">
            {score.correct}/{score.total}
          </span>
        </span>
      </div>

      {started ? (
        <>
          <p className="text-sm font-medium" data-help="ear-training">
            Which interval did you hear?
          </p>
          <div className="flex flex-wrap gap-2">
            {INTERVAL_NAMES.map((name, semis) => {
              const revealCorrect = answered !== null && semis === question.semitones;
              const revealWrong = answered === semis && semis !== question.semitones;
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => guess(semis)}
                  disabled={answered !== null}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    revealCorrect
                      ? 'border-green-600 bg-green-500 text-white'
                      : revealWrong
                        ? 'border-red-600 bg-red-500 text-white'
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
              <span
                className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
              >
                {isCorrect ? 'Correct!' : `It was ${INTERVAL_NAMES[question.semitones]}.`}
              </span>
              <button
                type="button"
                onClick={next}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Next →
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
