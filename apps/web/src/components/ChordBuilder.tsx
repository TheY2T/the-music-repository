import { useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  CHORDS,
  intervalLabel,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
} from '@/lib/music-theory';

const ROOT_MIDI = 60; // C4 reference octave

export default function ChordBuilder() {
  const [root, setRoot] = useState(0);
  const [chordKey, setChordKey] = useState('major');

  const chord = CHORDS.find((c) => c.key === chordKey) ?? CHORDS[0];
  const flats = [1, 3, 5, 8, 10].includes(root);
  const tones = chord.intervals.map((interval) => ({
    name: pitchName((root + interval) % 12, flats),
    degree: intervalLabel(interval),
    midi: ROOT_MIDI + root + interval,
  }));

  function playBlock() {
    for (const tone of tones) {
      playTone(midiToFrequency(tone.midi), 1.1);
    }
  }

  function playArpeggio() {
    tones.forEach((tone, index) => {
      window.setTimeout(() => playTone(midiToFrequency(tone.midi), 0.7), index * 180);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Root</span>
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
          <span className="block font-medium" data-help="chords">
            Chord type
          </span>
          <select
            value={chordKey}
            onChange={(e) => setChordKey(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {CHORDS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {pitchName(root, flats)} {chord.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => (
            <div
              key={tone.degree}
              className="rounded-md border border-border px-4 py-2 text-center"
            >
              <div className="text-lg font-semibold">{tone.name}</div>
              <div className="text-xs text-muted-foreground">{tone.degree}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Formula: {chord.intervals.map((i) => intervalLabel(i)).join(' · ')}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={playBlock}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ▶ Play chord
        </button>
        <button
          type="button"
          onClick={playArpeggio}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          Arpeggiate
        </button>
      </div>
    </div>
  );
}
