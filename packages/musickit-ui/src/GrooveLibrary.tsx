import { getAudioContext, scheduleDrum } from '@TheY2T/tmr-music-core/audio';
import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';

type Row = number[]; // 8 eighth-note steps, 1 = hit

interface Groove {
  key: string;
  label: string;
  hihat: Row;
  snare: Row;
  kick: Row;
}

const GROOVES: Groove[] = [
  {
    key: 'rock',
    label: 'Rock',
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    kick: [1, 0, 0, 0, 1, 0, 0, 0],
  },
  {
    key: 'pop',
    label: 'Pop',
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    kick: [1, 0, 0, 1, 0, 0, 1, 0],
  },
  {
    key: 'funk',
    label: 'Funk',
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    snare: [0, 0, 1, 0, 0, 1, 1, 0],
    kick: [1, 0, 0, 1, 0, 0, 0, 1],
  },
  {
    key: 'halftime',
    label: 'Half-time',
    hihat: [1, 1, 1, 1, 1, 1, 1, 1],
    snare: [0, 0, 0, 0, 1, 0, 0, 0],
    kick: [1, 0, 0, 0, 0, 0, 1, 0],
  },
];

const VOICES: { key: 'hihat' | 'snare' | 'kick'; label: string }[] = [
  { key: 'hihat', label: 'Hi-hat' },
  { key: 'snare', label: 'Snare' },
  { key: 'kick', label: 'Kick' },
];

export default function GrooveLibrary() {
  const [grooveKey, setGrooveKey] = useState('rock');
  const [bpm, setBpm] = useState(100);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);

  const groove = GROOVES.find((g) => g.key === grooveKey) ?? GROOVES[0];
  const grooveRef = useRef(groove);
  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    grooveRef.current = groove;
  }, [groove]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!running) {
      return;
    }
    let i = 0;
    const tick = () => {
      const g = grooveRef.current;
      const ctx = getAudioContext();
      const t = ctx ? ctx.currentTime + 0.02 : 0;
      if (ctx) {
        if (g.hihat[i]) {
          scheduleDrum('hihat', t);
        }
        if (g.snare[i]) {
          scheduleDrum('snare', t);
        }
        if (g.kick[i]) {
          scheduleDrum('kick', t);
        }
      }
      setStep(i);
      i = (i + 1) % 8;
      timerRef.current = window.setTimeout(tick, (60 / bpmRef.current / 2) * 1000);
    };
    tick();
    return () => {
      window.clearTimeout(timerRef.current);
      setStep(-1);
    };
  }, [running]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="rhythm">
            Groove
          </span>
          <Select
            value={grooveKey}
            onChange={(e) => setGrooveKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {GROOVES.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Tempo</span>
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

      <div className="space-y-1">
        {VOICES.map((voice) => (
          <div key={voice.key} className="flex items-center gap-1">
            <span className="w-16 text-xs text-muted-foreground">{voice.label}</span>
            {groove[voice.key].map((on, i) => (
              <div
                key={`${voice.key}-${i}`}
                className={`h-7 w-7 rounded-sm border ${
                  on ? 'border-blue-600 bg-blue-500' : 'border-border bg-transparent'
                } ${running && step === i ? 'ring-2 ring-inset ring-amber-400' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant={running ? 'outline' : 'default'}
        className="px-6"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? (
          <>
            <Icon name="square" className="size-3 fill-current" />
            Stop
          </>
        ) : (
          <>
            <Icon name="play" className="size-4" />
            Play
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Classic drum grooves (kick / snare / hi-hat over eighth notes) — loop them at any tempo to
        play or practise along. The amber outline follows the beat.
      </p>
    </div>
  );
}
