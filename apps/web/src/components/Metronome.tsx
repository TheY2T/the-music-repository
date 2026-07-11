import { useEffect, useRef, useState } from 'react';
import { getAudioContext, scheduleClick } from '@/lib/audio';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;
const BEATS_PER_BAR_CHOICES = [2, 3, 4, 6];

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [running, setRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);

  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerBar);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    beatsRef.current = beatsPerBar;
  }, [beatsPerBar]);

  useEffect(() => {
    if (!running) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) {
      setRunning(false);
      return;
    }
    nextNoteTimeRef.current = ctx.currentTime + 0.1;
    beatRef.current = 0;

    // Lookahead scheduler: schedule clicks slightly ahead so timing is sample-accurate,
    // regardless of setInterval jitter.
    function scheduler() {
      const context = getAudioContext();
      if (!context) {
        return;
      }
      while (nextNoteTimeRef.current < context.currentTime + SCHEDULE_AHEAD_S) {
        const beat = beatRef.current;
        const time = nextNoteTimeRef.current;
        scheduleClick(time, beat === 0);
        const delayMs = Math.max(0, (time - context.currentTime) * 1000);
        window.setTimeout(() => setCurrentBeat(beat), delayMs);
        nextNoteTimeRef.current += 60 / bpmRef.current;
        beatRef.current = (beat + 1) % beatsRef.current;
      }
    }

    scheduler();
    const timer = window.setInterval(scheduler, LOOKAHEAD_MS);
    return () => {
      window.clearInterval(timer);
      setCurrentBeat(-1);
    };
  }, [running]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <span
            key={i}
            className={`h-5 w-5 rounded-full border ${
              currentBeat === i
                ? i === 0
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-blue-400 bg-blue-400'
                : 'border-border bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-5xl font-bold tabular-nums" data-help="rhythm">
          {bpm}
          <span className="ml-2 text-lg font-normal text-muted-foreground">BPM</span>
        </div>
        <input
          type="range"
          min={40}
          max={240}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full max-w-md"
          aria-label="Tempo (BPM)"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          Beats per bar
          <select
            value={beatsPerBar}
            onChange={(e) => setBeatsPerBar(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {BEATS_PER_BAR_CHOICES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className={`rounded-md px-6 py-2 text-sm font-medium ${
            running ? 'border border-border' : 'bg-primary text-primary-foreground'
          }`}
        >
          {running ? '■ Stop' : '▶ Start'}
        </button>
      </div>
    </div>
  );
}
