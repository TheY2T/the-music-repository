import { Button, Card } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { INTERVAL_NAMES, midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

const ROOT_MIDI = 60;

interface Round {
  root: number; // pitch class
  semitones: number;
}

function makeRound(): Round {
  return { root: Math.floor(Math.random() * 12), semitones: 1 + Math.floor(Math.random() * 12) };
}

export default function IntervalConstructionQuiz() {
  const [round, setRound] = useState<Round>(makeRound);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const targetPc = (round.root + round.semitones) % 12;
  const flats = [1, 3, 5, 8, 10].includes(round.root);

  function guess(pc: number) {
    if (answered !== null) {
      return;
    }
    setAnswered(pc);
    setScore((s) => ({ correct: s.correct + (pc === targetPc ? 1 : 0), total: s.total + 1 }));
    // Play the interval to confirm.
    playTone(midiToFrequency(ROOT_MIDI + round.root), 0.6);
    window.setTimeout(
      () => playTone(midiToFrequency(ROOT_MIDI + round.root + round.semitones), 0.6),
      400,
    );
  }

  function next() {
    setRound(makeRound());
    setAnswered(null);
  }

  return (
    <div className="space-y-5">
      <span className="text-sm text-muted-foreground">
        Score: {score.correct}/{score.total}
      </span>

      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Build a</p>
        <p className="my-1 text-2xl font-bold" data-help="intervals">
          {INTERVAL_NAMES[round.semitones]}
        </p>
        <p className="text-sm text-muted-foreground">
          above{' '}
          <span className="font-semibold text-foreground">{pitchName(round.root, flats)}</span>
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {ROOT_CHOICES.map((pc) => {
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
              key={pc}
              type="button"
              onClick={() => guess(pc)}
              disabled={answered !== null}
              className={`h-10 w-12 rounded-md border text-sm font-medium transition-colors ${
                state === 'correct'
                  ? 'border-green-600 bg-green-600/15'
                  : state === 'wrong'
                    ? 'border-red-600 bg-red-600/15'
                    : 'border-border hover:bg-muted'
              }`}
            >
              {pitchName(pc, flats)}
            </button>
          );
        })}
      </div>

      {answered !== null ? (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {answered === targetPc ? '✓ Correct!' : `✗ It was ${pitchName(targetPc, flats)}`}
          </span>
          <Button type="button" variant="outline" onClick={next}>
            Next →
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Pick the note that completes the interval.</p>
      )}
      <p className="text-xs text-muted-foreground">
        The complement of the ear trainer — here you <strong>build</strong> the interval instead of
        naming it. The interval plays when you answer.
      </p>
    </div>
  );
}
