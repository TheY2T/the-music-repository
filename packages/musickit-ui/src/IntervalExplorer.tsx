import { playTone } from '@TheY2T/tmr-music-core/audio';
import {
  INTERVAL_NAMES,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
} from '@TheY2T/tmr-music-core/music-theory';
import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';

const ROOT_MIDI = 60;

export default function IntervalExplorer() {
  const [root, setRoot] = useState(0);
  const [semitones, setSemitones] = useState(7);

  const flats = [1, 3, 5, 8, 10].includes(root);
  const lowMidi = ROOT_MIDI + root;
  const highMidi = lowMidi + semitones;
  const lowName = pitchName(root, flats);
  const highName = pitchName((root + semitones) % 12, flats);

  function playMelodic() {
    playTone(midiToFrequency(lowMidi), 0.7);
    window.setTimeout(() => playTone(midiToFrequency(highMidi), 0.7), 550);
  }
  function playHarmonic() {
    playTone(midiToFrequency(lowMidi), 1.2);
    playTone(midiToFrequency(highMidi), 1.2);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Lower note</span>
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
          <span className="block font-medium" data-help="ear-training">
            Interval
          </span>
          <Select
            value={semitones}
            onChange={(e) => setSemitones(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {INTERVAL_NAMES.map((name, semis) => (
              <option key={name} value={semis}>
                {name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{INTERVAL_NAMES[semitones]}</h2>
        <p className="text-lg">
          <span className="font-semibold">{lowName}</span> →{' '}
          <span className="font-semibold">{highName}</span>{' '}
          <span className="text-sm text-muted-foreground">({semitones} semitones)</span>
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={playMelodic}>
          <Icon name="play" className="size-4" />
          Melodic
        </Button>
        <Button type="button" variant="outline" onClick={playHarmonic}>
          Harmonic
        </Button>
      </div>
    </div>
  );
}
