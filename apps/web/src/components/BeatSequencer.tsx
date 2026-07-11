import { useEffect, useRef, useState } from 'react';
import { type DrumVoice, getAudioContext, scheduleDrum } from '@/lib/audio';

const STEPS = 16;
const TRACKS: { label: string; voice: DrumVoice }[] = [
  { label: 'Hi-hat', voice: 'hihat' },
  { label: 'Snare', voice: 'snare' },
  { label: 'Kick', voice: 'kick' },
];

function initialGrid(): boolean[][] {
  const grid = TRACKS.map(() => Array<boolean>(STEPS).fill(false));
  for (let s = 0; s < STEPS; s += 2) {
    grid[0][s] = true; // hi-hat on eighths
  }
  grid[1][4] = true;
  grid[1][12] = true; // snare on the backbeat
  grid[2][0] = true;
  grid[2][8] = true; // kick on 1 and 3
  return grid;
}

export default function BeatSequencer() {
  const [bpm, setBpm] = useState(100);
  const [grid, setGrid] = useState<boolean[][]>(initialGrid);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const bpmRef = useRef(bpm);
  const gridRef = useRef(grid);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    if (!running) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) {
      setRunning(false);
      return;
    }
    nextTimeRef.current = ctx.currentTime + 0.1;
    stepRef.current = 0;

    function scheduler() {
      const context = getAudioContext();
      if (!context) {
        return;
      }
      while (nextTimeRef.current < context.currentTime + 0.12) {
        const step = stepRef.current;
        const time = nextTimeRef.current;
        TRACKS.forEach((track, trackIndex) => {
          if (gridRef.current[trackIndex][step]) {
            scheduleDrum(track.voice, time);
          }
        });
        const delayMs = Math.max(0, (time - context.currentTime) * 1000);
        window.setTimeout(() => setCurrentStep(step), delayMs);
        nextTimeRef.current += 60 / bpmRef.current / 4; // 16th notes
        stepRef.current = (step + 1) % STEPS;
      }
    }

    scheduler();
    const timer = window.setInterval(scheduler, 25);
    return () => {
      window.clearInterval(timer);
      setCurrentStep(-1);
    };
  }, [running]);

  function toggle(track: number, step: number) {
    setGrid((prev) =>
      prev.map((row, ti) => (ti === track ? row.map((v, si) => (si === step ? !v : v)) : row)),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className={`rounded-md px-6 py-2 text-sm font-medium ${
            running ? 'border border-border' : 'bg-primary text-primary-foreground'
          }`}
        >
          {running ? '■ Stop' : '▶ Play'}
        </button>
        <label className="flex items-center gap-2 text-sm" data-help="rhythm">
          Tempo
          <input
            type="range"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
          <span className="font-mono">{bpm} BPM</span>
        </label>
        <button
          type="button"
          onClick={() => setGrid(TRACKS.map(() => Array<boolean>(STEPS).fill(false)))}
          className="text-sm text-muted-foreground underline"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 overflow-x-auto">
        {TRACKS.map((track, trackIndex) => (
          <div key={track.voice} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
              {track.label}
            </span>
            <div className="flex gap-1">
              {grid[trackIndex].map((active, step) => (
                <button
                  type="button"
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length step grid.
                  key={step}
                  aria-label={`${track.label} step ${step + 1}`}
                  aria-pressed={active}
                  onClick={() => toggle(trackIndex, step)}
                  className={`h-7 w-7 rounded ${step % 4 === 0 ? 'ml-1' : ''} ${
                    active ? 'bg-blue-500' : 'bg-muted'
                  } ${currentStep === step ? 'ring-2 ring-blue-400' : ''}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Click cells to build a beat, then press Play. Every four steps is one beat.
      </p>
    </div>
  );
}
