import { useEffect, useRef, useState } from 'react';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { getAudioContext, playTone, scheduleClick } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

// One bar of 4/4; each array of note durations (in beats) sums to 4.
const RHYTHMS = [
  { key: 'quarters', label: 'Quarter notes', beats: [1, 1, 1, 1] },
  { key: 'eighths', label: 'Eighth notes', beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { key: 'syncopated', label: 'Syncopated', beats: [1, 0.5, 0.5, 1, 1] },
  { key: 'gallop', label: 'Gallop', beats: [1, 0.5, 0.5, 0.5, 0.5, 1] },
  { key: 'dotted', label: 'Dotted', beats: [1.5, 0.5, 1, 1] },
];

// Rhythm notes sit on the middle staff line (step 4).
const toNotes = (beats: number[]): StaffNoteDatum[] =>
  beats.map((b) => ({ step: 4, label: '', beats: b }));

export default function RhythmTrainer() {
  const [rhythmKey, setRhythmKey] = useState('syncopated');
  const [bpm, setBpm] = useState(90);
  const [click, setClick] = useState(true);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(-1);

  const rhythm = RHYTHMS.find((r) => r.key === rhythmKey) ?? RHYTHMS[0];
  const notes = toNotes(rhythm.beats);

  const beatsRef = useRef(rhythm.beats);
  const bpmRef = useRef(bpm);
  const noteTimerRef = useRef(0);
  const clickTimerRef = useRef(0);
  useEffect(() => {
    beatsRef.current = rhythm.beats;
  });
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Play the rhythm (a woodblock per note), looping.
  useEffect(() => {
    if (!running) {
      return;
    }
    let i = 0;
    const step = () => {
      const seq = beatsRef.current;
      const beats = seq[i % seq.length];
      playTone(midiToFrequency(84), 0.09); // short high woodblock
      setActive(i % seq.length);
      i += 1;
      noteTimerRef.current = window.setTimeout(step, beats * (60 / bpmRef.current) * 1000);
    };
    step();
    return () => {
      window.clearTimeout(noteTimerRef.current);
      setActive(-1);
    };
  }, [running, rhythmKey]);

  // Steady beat click alongside the rhythm.
  useEffect(() => {
    if (!running || !click) {
      return;
    }
    let beat = 0;
    const tick = () => {
      const ctx = getAudioContext();
      if (ctx) {
        scheduleClick(ctx.currentTime + 0.02, beat % 4 === 0);
      }
      beat += 1;
      clickTimerRef.current = window.setTimeout(tick, 60000 / bpmRef.current);
    };
    tick();
    return () => window.clearTimeout(clickTimerRef.current);
  }, [running, click]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="rhythm">
            Rhythm
          </span>
          <select
            value={rhythmKey}
            onChange={(e) => setRhythmKey(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {RHYTHMS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Tempo</span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={50}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={click} onChange={(e) => setClick(e.target.checked)} />
          Click
        </label>
      </div>

      <StaffSequence notes={notes} activeIndex={active} />

      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        className={`rounded-md px-6 py-2 text-sm font-medium ${
          running ? 'border border-border' : 'bg-primary text-primary-foreground'
        }`}
      >
        {running ? '■ Stop' : '▶ Play'}
      </button>
      <p className="text-xs text-muted-foreground">
        Read the rhythm, then press Play to hear it (a woodblock per note) over a steady click. Clap
        or tap along, then slow the tempo if a figure trips you up.
      </p>
    </div>
  );
}
