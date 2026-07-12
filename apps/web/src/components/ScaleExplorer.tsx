import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  intervalLabel,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
  SCALES,
  stepPattern,
} from '@/lib/music-theory';

const ROOT_MIDI = 60; // C4 reference octave

export default function ScaleExplorer() {
  const [root, setRoot] = useState(0);
  const [scaleKey, setScaleKey] = useState('major');

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const flats = [1, 3, 5, 8, 10].includes(root);
  const degrees = scale.intervals.map((interval) => ({
    name: pitchName((root + interval) % 12, flats),
    degree: intervalLabel(interval),
    midi: ROOT_MIDI + root + interval,
  }));
  const steps = stepPattern(scale.intervals);

  function playAscending() {
    const notes = [...degrees.map((d) => d.midi), ROOT_MIDI + root + 12];
    notes.forEach((midi, index) => {
      window.setTimeout(() => playTone(midiToFrequency(midi), 0.5), index * 220);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Root</span>
          <Select
            value={root}
            onChange={(e) => setRoot(Number(e.target.value))}
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
            className="h-auto w-auto px-2 py-1"
          >
            {SCALES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {pitchName(root, flats)} {scale.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {degrees.map((d) => (
            <button
              type="button"
              key={d.degree}
              onClick={() => playTone(midiToFrequency(d.midi))}
              className="rounded-md border border-border px-4 py-2 text-center hover:bg-muted"
            >
              <div className="text-lg font-semibold">{d.name}</div>
              <div className="text-xs text-muted-foreground">{d.degree}</div>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Step pattern: {steps.join(' – ')}</p>
      </div>

      <Button type="button" onClick={playAscending}>
        <Icon name="play" className="size-4" />
        Play ascending
      </Button>
    </div>
  );
}
