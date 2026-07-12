import { useEffect, useRef, useState } from 'react';
import { ChordDiagram, GUITAR_CHORDS } from '@/components/ChordDiagrams';
import { getAudioContext, scheduleDrum, scheduleTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

// Chord name → audio spec (root pitch class + triad intervals).
const CHORD_AUDIO: Record<string, { root: number; intervals: number[] }> = {
  C: { root: 0, intervals: [0, 4, 7] },
  D: { root: 2, intervals: [0, 4, 7] },
  E: { root: 4, intervals: [0, 4, 7] },
  F: { root: 5, intervals: [0, 4, 7] },
  G: { root: 7, intervals: [0, 4, 7] },
  A: { root: 9, intervals: [0, 4, 7] },
  Am: { root: 9, intervals: [0, 3, 7] },
  Em: { root: 4, intervals: [0, 3, 7] },
  Dm: { root: 2, intervals: [0, 3, 7] },
  Bm: { root: 11, intervals: [0, 3, 7] },
};

const PROGRESSIONS = [
  { key: 'pop', label: 'C – G – Am – F', chords: ['C', 'G', 'Am', 'F'] },
  { key: 'fifties', label: 'C – Am – F – G', chords: ['C', 'Am', 'F', 'G'] },
  { key: 'gaxis', label: 'G – D – Em – C', chords: ['G', 'D', 'Em', 'C'] },
  { key: 'vi', label: 'Am – F – C – G', chords: ['Am', 'F', 'C', 'G'] },
];

const chordShape = (name: string) => GUITAR_CHORDS.find((c) => c.name === name) ?? GUITAR_CHORDS[0];

export default function PracticeRoom() {
  const [progKey, setProgKey] = useState('pop');
  const [bpm, setBpm] = useState(96);
  const [running, setRunning] = useState(false);
  const [bar, setBar] = useState(0);
  const [beat, setBeat] = useState(-1);

  const progression = PROGRESSIONS.find((p) => p.key === progKey) ?? PROGRESSIONS[0];
  const progRef = useRef(progression);
  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    progRef.current = progression;
  }, [progression]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!running) {
      return;
    }
    let barIndex = 0;
    let beatIndex = 0;
    const step = () => {
      const ctx = getAudioContext();
      const chords = progRef.current.chords;
      const audio = CHORD_AUDIO[chords[barIndex]] ?? CHORD_AUDIO.C;
      if (ctx) {
        const t = ctx.currentTime + 0.02;
        const secPerBeat = 60 / bpmRef.current;
        const rootPc = audio.root;
        // Drums.
        scheduleDrum('hihat', t);
        scheduleDrum('hihat', t + secPerBeat / 2);
        if (beatIndex === 0 || beatIndex === 2) {
          scheduleDrum('kick', t);
        }
        if (beatIndex === 1 || beatIndex === 3) {
          scheduleDrum('snare', t);
        }
        // Bass root (1) / fifth (3).
        if (beatIndex === 0) {
          scheduleTone(midiToFrequency(36 + rootPc), t, secPerBeat * 0.9, {
            type: 'sine',
            gain: 0.4,
          });
        }
        if (beatIndex === 2) {
          scheduleTone(midiToFrequency(36 + rootPc + 7), t, secPerBeat * 0.9, {
            type: 'sine',
            gain: 0.4,
          });
        }
        // Comping stabs on off-beats.
        if (beatIndex === 1 || beatIndex === 3) {
          for (const iv of audio.intervals) {
            scheduleTone(midiToFrequency(60 + rootPc + iv), t, secPerBeat * 0.5, {
              type: 'triangle',
              gain: 0.1,
            });
          }
        }
      }
      setBar(barIndex);
      setBeat(beatIndex);
      beatIndex += 1;
      if (beatIndex >= 4) {
        beatIndex = 0;
        barIndex = (barIndex + 1) % chords.length;
      }
      timerRef.current = window.setTimeout(step, (60 / bpmRef.current) * 1000);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setBeat(-1);
    };
  }, [running]);

  const currentChordName = progression.chords[bar] ?? progression.chords[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="chords">
            Progression
          </span>
          <select
            value={progKey}
            onChange={(e) => setProgKey(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {PROGRESSIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="rhythm">
            Tempo
          </span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-6">
        {/* Beat indicator */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border ${
                running && beat === i
                  ? i === 0
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-blue-400 bg-blue-400'
                  : 'border-border'
              }`}
            />
          ))}
        </div>
        <ChordDiagram chord={chordShape(currentChordName)} />
        <span className="text-2xl font-bold">{currentChordName}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {progression.chords.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className={`rounded-md border px-4 py-2 text-sm font-semibold ${
              running && bar === i ? 'border-blue-500 bg-blue-500/15' : 'border-border'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

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
        A jam station — pick a progression and tempo, and the band (drums + bass + comping) loops
        while the current chord's shape and the beat are shown. Grab your instrument and play along.
      </p>
    </div>
  );
}
