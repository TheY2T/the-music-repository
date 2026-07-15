import type { Locale } from '@TheY2T/tmr-i18n';
import { Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import ScorePlayer from '@/components/ScorePlayer';
import { rhythmToAlphaTex } from '@/lib/score/alphatex';

// One bar of 4/4; each array of note durations (in beats) sums to 4.
const RHYTHMS = [
  { key: 'quarters', label: 'Quarter notes', beats: [1, 1, 1, 1] },
  { key: 'eighths', label: 'Eighth notes', beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { key: 'syncopated', label: 'Syncopated', beats: [1, 0.5, 0.5, 1, 1] },
  { key: 'gallop', label: 'Gallop', beats: [1, 0.5, 0.5, 0.5, 0.5, 1] },
  { key: 'dotted', label: 'Dotted', beats: [1.5, 0.5, 1, 1] },
];

/**
 * `/tools/rhythm` — read + clap a one-bar rhythm (ADR 0027; was StaffSequence + a woodblock loop). The
 * pattern is rendered on a single staff pitch by alphaTab and played by the shared {@link ScorePlayer},
 * which supplies the tempo, A–B loop, and metronome the trainer needs.
 */
export default function RhythmTrainer({ locale }: { locale: Locale }) {
  const [rhythmKey, setRhythmKey] = useState('quarters');
  const rhythm = RHYTHMS.find((r) => r.key === rhythmKey) ?? RHYTHMS[0];
  const tex = rhythmToAlphaTex(rhythm.beats, { title: rhythm.label, tempo: 100 });

  return (
    <div className="space-y-4">
      <label className="space-y-1 text-sm">
        <span className="block font-medium" data-help="rhythm">
          Rhythm
        </span>
        <Select
          value={rhythmKey}
          onChange={(e) => setRhythmKey(e.target.value)}
          className="h-auto w-auto px-2 py-1"
        >
          {RHYTHMS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </Select>
      </label>

      <ScorePlayer key={rhythmKey} tex={tex} mode="standard" locale={locale} interactive />

      <p className="text-xs text-muted-foreground">
        Read the rhythm, then press Play to hear it. Turn on the metronome to lock in the pulse,
        slow the tempo to learn it, or set an A–B loop to drill a tricky spot.
      </p>
    </div>
  );
}
