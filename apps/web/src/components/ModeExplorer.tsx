import { Chip, Icon, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { intervalLabel, MODES, midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

const ROOT_MIDI = 60;

export default function ModeExplorer() {
  const [root, setRoot] = useState(0);
  const flats = [1, 3, 5, 8, 10].includes(root);

  function playMode(intervals: number[]) {
    const notes = [...intervals, 12];
    notes.forEach((interval, index) => {
      window.setTimeout(
        () => playTone(midiToFrequency(ROOT_MIDI + root + interval), 0.45),
        index * 200,
      );
    });
  }

  return (
    <div className="space-y-6">
      <label className="space-y-1 text-sm">
        <span className="block font-medium" data-help="modes">
          Root
        </span>
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

      <p className="text-xs text-muted-foreground">Ordered brightest → darkest.</p>
      <ul className="space-y-3">
        {MODES.map((mode) => (
          <li key={mode.key} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">
                {pitchName(root, flats)} {mode.name}
              </h2>
              <Chip variant="muted">characteristic {mode.characteristic}</Chip>
              <button
                type="button"
                onClick={() => playMode(mode.intervals)}
                className="ml-auto text-sm underline"
              >
                <Icon name="play" className="size-4" />
                Play
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mode.intervals.map((interval) => (
                <span
                  key={interval}
                  className="rounded border border-border px-2 py-0.5 text-sm"
                  title={intervalLabel(interval)}
                >
                  {pitchName((root + interval) % 12, flats)}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
