import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { INTERVAL_NAMES, midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

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
          <select
            value={root}
            onChange={(e) => setRoot(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {ROOT_CHOICES.map((pc) => (
              <option key={pc} value={pc}>
                {pitchName(pc)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="ear-training">
            Interval
          </span>
          <select
            value={semitones}
            onChange={(e) => setSemitones(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {INTERVAL_NAMES.map((name, semis) => (
              <option key={name} value={semis}>
                {name}
              </option>
            ))}
          </select>
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
        <button
          type="button"
          onClick={playMelodic}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ▶ Melodic
        </button>
        <button
          type="button"
          onClick={playHarmonic}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          Harmonic
        </button>
      </div>
    </div>
  );
}
