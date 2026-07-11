import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { diatonicChords, midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

const ROOT_MIDI = 60;

interface Step {
  roman: string;
  name: string;
  pitchClasses: number[];
}

export default function ProgressionBuilder() {
  const [key, setKey] = useState(0);
  const [progression, setProgression] = useState<Step[]>([]);

  const flats = [1, 3, 5, 8, 10].includes(key);
  const chords = diatonicChords(key, flats);

  function playChord(pitchClasses: number[]) {
    for (const pc of pitchClasses) {
      playTone(midiToFrequency(ROOT_MIDI + pc), 1);
    }
  }

  function playProgression() {
    progression.forEach((step, index) => {
      window.setTimeout(() => playChord(step.pitchClasses), index * 900);
    });
  }

  return (
    <div className="space-y-6">
      <label className="space-y-1 text-sm">
        <span className="block font-medium">Key</span>
        <select
          value={key}
          onChange={(e) => {
            setKey(Number(e.target.value));
            setProgression([]);
          }}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {ROOT_CHOICES.map((pc) => (
            <option key={pc} value={pc}>
              {pitchName(pc)} major
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium" data-help="chords">
          Diatonic chords — click to add
        </p>
        <div className="flex flex-wrap gap-2">
          {chords.map((chord) => (
            <button
              type="button"
              key={chord.roman}
              onClick={() => {
                playChord(chord.pitchClasses);
                setProgression((prev) => [...prev, chord]);
              }}
              className="rounded-md border border-border px-3 py-2 text-center hover:bg-muted"
            >
              <div className="text-xs text-muted-foreground">{chord.roman}</div>
              <div className="font-medium">{chord.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Progression</h2>
          {progression.length ? (
            <>
              <button type="button" onClick={playProgression} className="text-sm underline">
                ▶ Play
              </button>
              <button
                type="button"
                onClick={() => setProgression([])}
                className="text-sm text-muted-foreground underline"
              >
                Clear
              </button>
            </>
          ) : null}
        </div>
        {progression.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Click chords above to build a progression (e.g. I – V – vi – IV).
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-lg">
            {progression.map((step, index) => (
              <span key={`${step.roman}-${index}`} className="flex items-baseline gap-1">
                <span className="font-semibold">{step.roman}</span>
                <span className="text-sm text-muted-foreground">({step.name})</span>
                {index < progression.length - 1 ? (
                  <span className="text-muted-foreground">–</span>
                ) : null}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
