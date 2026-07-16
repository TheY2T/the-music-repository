import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import InstrumentLoading from '@/components/InstrumentLoading';
import LevelToggle from '@/components/LevelToggle';
import { pitchName, ROOT_CHOICES, SCALES, scalesByLevel } from '@/lib/music-theory';
import { playNote } from '@/lib/soundfont';
import { useInstrumentReady } from '@/lib/use-instrument-ready';
import { useLevel } from '@/lib/use-level';

const BASE = 60; // C4
const NOTES_PER_BEAT = 2; // eighth notes

export default function SpeedTrainer() {
  const { level, setLevel } = useLevel();
  const { ready } = useInstrumentReady();
  const [root, setRoot] = useState(0);
  const [scaleKey, setScaleKey] = useState('major');
  const [startBpm, setStartBpm] = useState(60);
  const [targetBpm, setTargetBpm] = useState(120);
  const [step, setStep] = useState(5);
  const [everyN, setEveryN] = useState(2);

  const [running, setRunning] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(60);
  const [loops, setLoops] = useState(0);

  const scaleChoices = scalesByLevel(level);
  useEffect(() => {
    if (!scaleChoices.some((s) => s.key === scaleKey)) setScaleKey(scaleChoices[0]?.key ?? 'major');
  }, [scaleChoices, scaleKey]);

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];

  const bpmRef = useRef(startBpm);
  const idxRef = useRef(0);
  const loopsRef = useRef(0);
  const runningRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Snapshot the loop notes + ramp settings at Start so live edits don't disrupt a run.
  const notesRef = useRef<number[]>([]);
  const cfgRef = useRef({ target: 120, step: 5, everyN: 2 });

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const notes = notesRef.current;
    playNote(notes[idxRef.current], (60 / bpmRef.current / NOTES_PER_BEAT) * 0.95);
    idxRef.current = (idxRef.current + 1) % notes.length;
    if (idxRef.current === 0) {
      loopsRef.current += 1;
      setLoops(loopsRef.current);
      const { target, step: st, everyN: n } = cfgRef.current;
      if (loopsRef.current % n === 0 && bpmRef.current < target) {
        bpmRef.current = Math.min(target, bpmRef.current + st);
        setCurrentBpm(bpmRef.current);
      }
    }
    const interval = (60 / bpmRef.current / NOTES_PER_BEAT) * 1000;
    timer.current = setTimeout(tick, interval);
  }, []);

  function start() {
    const up = [...scale.intervals.map((i) => BASE + root + i), BASE + root + 12];
    notesRef.current = [...up, ...up.slice(1, -1).reverse()];
    cfgRef.current = { target: targetBpm, step, everyN };
    bpmRef.current = startBpm;
    idxRef.current = 0;
    loopsRef.current = 0;
    setCurrentBpm(startBpm);
    setLoops(0);
    runningRef.current = true;
    setRunning(true);
    if (timer.current) clearTimeout(timer.current);
    tick();
  }

  if (!ready) return <InstrumentLoading />;

  const atTarget = running && currentBpm >= targetBpm;
  const numField = (
    label: string,
    value: number,
    set: (n: number) => void,
    min: number,
    max: number,
    stepBy = 5,
  ) => (
    <label className="space-y-1 text-sm">
      <span className="block font-medium">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={stepBy}
        disabled={running}
        onChange={(e) => set(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="w-20 rounded-md border border-border bg-background px-2 py-1 disabled:opacity-50"
      />
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Root</span>
          <Select
            value={root}
            onChange={(e) => setRoot(Number(e.target.value))}
            disabled={running}
            className="h-auto w-auto px-2 py-1"
          >
            {ROOT_CHOICES.map((pc) => (
              <option key={pc} value={pc}>
                {pitchName(pc)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="scales">
            Scale
          </span>
          <Select
            value={scaleKey}
            onChange={(e) => setScaleKey(e.target.value)}
            disabled={running}
            className="h-auto w-auto px-2 py-1"
          >
            {scaleChoices.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
        <LevelToggle level={level} onChange={setLevel} />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {numField('Start BPM', startBpm, setStartBpm, 30, 240)}
        {numField('Target BPM', targetBpm, setTargetBpm, 40, 300)}
        {numField('Speed up by', step, setStep, 1, 30, 1)}
        {numField('Every N loops', everyN, setEveryN, 1, 8, 1)}
      </div>

      <div className="flex items-center gap-4">
        {running ? (
          <Button type="button" variant="outline" onClick={stop}>
            <Icon name="square" className="size-4" />
            Stop
          </Button>
        ) : (
          <Button type="button" onClick={start}>
            <Icon name="play" className="size-4" />
            Start
          </Button>
        )}
        <div className="text-sm">
          Tempo{' '}
          <span
            className={`font-mono text-2xl font-bold ${atTarget ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}
          >
            {currentBpm}
          </span>{' '}
          BPM {atTarget ? '· at target!' : `→ ${targetBpm}`}
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          Loops <span className="font-mono text-foreground">{loops}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Loops {pitchName(root)} {scale.name} up and down, nudging the tempo up every few passes
        until it reaches your target — the disciplined way to build speed cleanly. Set the ramp, hit
        Start, and play along. Raise the level for more scales.
      </p>
    </div>
  );
}
