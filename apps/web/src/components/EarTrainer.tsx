import { Button, Icon } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playTone } from '@/lib/audio';
import { INTERVAL_NAMES, midiToFrequency } from '@/lib/music-theory';
import { useMidiInput } from '@/lib/use-midi-input';

interface Question {
  root: number;
  semitones: number;
}

function makeQuestion(): Question {
  return { root: 48 + Math.floor(Math.random() * 24), semitones: Math.floor(Math.random() * 13) };
}

function playInterval(question: Question) {
  playTone(midiToFrequency(question.root), 0.7);
  window.setTimeout(() => playTone(midiToFrequency(question.root + question.semitones), 0.7), 550);
}

/** Reduce a raw MIDI note distance to an interval within an octave (0–12). */
function reduceInterval(distance: number): number {
  let d = Math.abs(distance);
  while (d > 12) {
    d -= 12;
  }
  return d;
}

export default function EarTrainer() {
  const [question, setQuestion] = useState<Question>(makeQuestion);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [started, setStarted] = useState(false);

  const questionRef = useRef(question);
  const answeredRef = useRef(answered);
  const startedRef = useRef(started);
  const bufferRef = useRef<number[]>([]);
  useEffect(() => {
    questionRef.current = question;
  }, [question]);
  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);
  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  const submit = useCallback((semitones: number) => {
    if (answeredRef.current !== null) {
      return;
    }
    answeredRef.current = semitones;
    setAnswered(semitones);
    setScore((s) => ({
      correct: s.correct + (semitones === questionRef.current.semitones ? 1 : 0),
      total: s.total + 1,
    }));
  }, []);

  // MIDI: play the two notes of the interval to answer.
  const onMidiNote = useCallback(
    (midiNote: number, isOn: boolean) => {
      if (!isOn || !startedRef.current || answeredRef.current !== null) {
        return;
      }
      const buf = bufferRef.current;
      buf.push(midiNote);
      if (buf.length >= 2) {
        submit(reduceInterval(buf[1] - buf[0]));
        bufferRef.current = [];
      }
    },
    [submit],
  );
  const midi = useMidiInput(onMidiNote);

  function start() {
    setStarted(true);
    playInterval(question);
  }

  function next() {
    const q = makeQuestion();
    questionRef.current = q;
    answeredRef.current = null;
    bufferRef.current = [];
    setQuestion(q);
    setAnswered(null);
    playInterval(q);
  }

  const isCorrect = answered !== null && answered === question.semitones;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        {!started ? (
          <Button type="button" onClick={start}>
            <Icon name="play" className="size-4" />
            Start — play an interval
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => playInterval(question)}>
            <Icon name="refresh" className="size-4" />
            Replay
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Score:{' '}
          <span className="font-mono text-foreground">
            {score.correct}/{score.total}
          </span>
        </span>
      </div>

      <p className="text-xs" data-help="keyboard">
        {midi.connected ? (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
            <Icon name="piano" className="size-4" /> {midi.deviceName ?? 'MIDI'} connected — answer
            by playing the two notes.
          </span>
        ) : midi.supported ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icon name="piano" className="size-4" /> Connect a MIDI keyboard to answer by playing.
          </span>
        ) : null}
      </p>

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
                  onClick={() => submit(semis)}
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
              <Button type="button" onClick={next}>
                Next
                <Icon name="arrow-right" className="size-4" />
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
