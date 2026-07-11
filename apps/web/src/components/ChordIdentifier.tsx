import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { identifyChords, midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

const ROOT_MIDI = 60;

export default function ChordIdentifier() {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const matches = identifyChords(selected);
  const sorted = [...selected].sort((a, b) => a - b);

  function toggle(pc: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pc)) {
        next.delete(pc);
      } else {
        next.add(pc);
      }
      return next;
    });
    playTone(midiToFrequency(ROOT_MIDI + pc), 0.5);
  }

  function playSelection() {
    for (const pc of sorted) {
      playTone(midiToFrequency(ROOT_MIDI + pc), 1.1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium" data-help="chords">
          Pick the notes
        </p>
        <div className="flex flex-wrap gap-2">
          {ROOT_CHOICES.map((pc) => (
            <button
              type="button"
              key={pc}
              onClick={() => toggle(pc)}
              aria-pressed={selected.has(pc)}
              className={`h-10 w-12 rounded-md border text-sm font-medium ${
                selected.has(pc)
                  ? 'border-blue-600 bg-blue-500 text-white'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {pitchName(pc)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">
            {sorted.length ? sorted.map((pc) => pitchName(pc)).join(' · ') : 'No notes selected'}
          </h2>
          {sorted.length ? (
            <>
              <button type="button" onClick={playSelection} className="text-sm underline">
                ▶ Play
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-sm text-muted-foreground underline"
              >
                Clear
              </button>
            </>
          ) : null}
        </div>

        {selected.size < 3 ? (
          <p className="text-sm text-muted-foreground">
            Pick at least three notes to name a chord.
          </p>
        ) : matches.length ? (
          <div className="flex flex-wrap gap-2">
            {matches.map((match) => (
              <span
                key={match}
                className="rounded-full border border-blue-500 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100"
              >
                {match}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No standard chord matches — try another combination.
          </p>
        )}
      </div>
    </div>
  );
}
