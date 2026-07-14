import { Button, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import DrillFeedback from '@/components/DrillFeedback';
import { playTone } from '@/lib/audio';
import { CHORDS, midiToFrequency } from '@/lib/music-theory';

// The chord qualities tested (a subset of CHORDS, keyed by their CHORDS `key`).
const QUALITIES = ['major', 'minor', 'diminished', 'augmented', 'dominant-7', 'major-7', 'minor-7'];
const QUALITY_CHORDS = QUALITIES.map((key) => CHORDS.find((c) => c.key === key) ?? CHORDS[0]);

function playChord(intervals: number[], root: number) {
  const midis = intervals.map((i) => 60 + root + i);
  for (const midi of midis) {
    playTone(midiToFrequency(midi), 1.4);
  }
  // A quick arpeggio after the block, to make the quality clearer.
  midis.forEach((midi, i) => {
    window.setTimeout(() => playTone(midiToFrequency(midi), 0.5), 700 + i * 200);
  });
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export default function ChordQualityEar() {
  const [current, setCurrent] = useState(0);
  const [root, setRoot] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    playChord(QUALITY_CHORDS[current].intervals, root);
  }, [current, root]);

  function guess(index: number) {
    if (answered !== null) {
      return;
    }
    setAnswered(index);
    setScore((s) => ({ correct: s.correct + (index === current ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setAnswered(null);
    setRoot(randomInt(12));
    setCurrent((c) => {
      let n = randomInt(QUALITIES.length);
      if (n === c) {
        n = (n + 1) % QUALITIES.length;
      }
      return n;
    });
  }

  return (
    <div className="space-y-5">
      <DrillFeedback
        result={answered === null ? null : answered === current ? 'correct' : 'wrong'}
      />
      <div className="flex items-center gap-4">
        <Button type="button" onClick={() => playChord(QUALITY_CHORDS[current].intervals, root)}>
          <Icon name="play" className="size-4" />
          Replay
        </Button>
        <span className="text-sm text-muted-foreground">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUALITY_CHORDS.map((chord, i) => {
          const state =
            answered === null
              ? 'idle'
              : i === current
                ? 'correct'
                : i === answered
                  ? 'wrong'
                  : 'idle';
          return (
            <button
              key={chord.key}
              type="button"
              onClick={() => guess(i)}
              disabled={answered !== null}
              data-help="chords"
              className={`rounded-lg border p-3 text-sm font-semibold transition-colors ${
                state === 'correct'
                  ? 'border-green-600 bg-green-600/15'
                  : state === 'wrong'
                    ? 'border-red-600 bg-red-600/15'
                    : 'border-border hover:bg-muted'
              }`}
            >
              {chord.name}
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
                It was {QUALITY_CHORDS[current].name}
              </>
            )}
          </span>
          <Button type="button" variant="outline" onClick={next}>
            Next
            <Icon name="arrow-right" className="size-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Listen, then name the chord quality.</p>
      )}
      <p className="text-xs text-muted-foreground">
        Each chord is played on a random root (block, then arpeggiated). Learn to hear the colour of
        each quality regardless of key.
      </p>
    </div>
  );
}
