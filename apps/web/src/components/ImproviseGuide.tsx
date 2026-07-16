import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import InstrumentLoading from '@/components/InstrumentLoading';
import LevelToggle from '@/components/LevelToggle';
import {
  CHORDS,
  chordsByLevel,
  intervalLabel,
  isWithinLevel,
  pitchName,
  ROOT_CHOICES,
  scalesForChord,
} from '@/lib/music-theory';
import { playNote } from '@/lib/soundfont';
import { useInstrumentReady } from '@/lib/use-instrument-ready';
import { useLevel } from '@/lib/use-level';

const ROOT_MIDI = 60; // C4 reference octave

export default function ImproviseGuide() {
  const { level, setLevel } = useLevel();
  const [root, setRoot] = useState(0);
  const [chordKey, setChordKey] = useState('dominant-7');

  const chordChoices = chordsByLevel(level);
  useEffect(() => {
    if (!chordChoices.some((c) => c.key === chordKey)) {
      setChordKey(chordChoices[0]?.key ?? 'major');
    }
  }, [chordChoices, chordKey]);

  const chord = CHORDS.find((c) => c.key === chordKey) ?? CHORDS[0];
  const flats = [1, 3, 5, 8, 10].includes(root);
  // Scales that contain the chord, disclosed to the learner's level.
  const matches = scalesForChord(root, chord.intervals).filter((s) =>
    isWithinLevel(s.level, level),
  );

  const chordTones = chord.intervals.map((i) => ROOT_MIDI + root + i);

  function playChord() {
    for (const midi of chordTones) playNote(midi, 1.4);
  }

  function playScaleOverChord(intervals: number[]) {
    // Sound the chord, then walk the scale up so you hear the colour against it.
    for (const midi of chordTones) playNote(midi, 2.4);
    const notes = [...intervals.map((i) => ROOT_MIDI + root + i), ROOT_MIDI + root + 12];
    notes.forEach((midi, index) => {
      window.setTimeout(() => playNote(midi, 0.45), 350 + index * 260);
    });
  }

  const { ready } = useInstrumentReady();
  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Chord root</span>
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
          <span className="block font-medium" data-help="chords">
            Chord type
          </span>
          <Select
            value={chordKey}
            onChange={(e) => setChordKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {chordChoices.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <LevelToggle level={level} onChange={setLevel} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">
            {pitchName(root, flats)} {chord.name}
          </h2>
          <Button type="button" size="sm" variant="outline" onClick={playChord}>
            <Icon name="play" className="size-4" />
            Hear chord
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Chord tones: {chord.intervals.map((i) => intervalLabel(i)).join(' · ')}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold" data-help="scales">
          Scales that fit ({matches.length})
        </h3>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scale at this level contains every chord tone — raise the level to see richer
            options.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {matches.map((scale) => (
              <li
                key={scale.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium">{scale.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {scale.intervals.map((i) => pitchName((root + i) % 12, flats)).join(' ')}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => playScaleOverChord(scale.intervals)}
                >
                  <Icon name="play" className="size-4" />
                  Play
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Pick a chord and hear which scales contain all its notes — safe choices for a solo or melody
        over that chord. Press Play on a scale to hear the chord ring while the scale climbs over
        it. Raise the level for modes, bebop and altered options.
      </p>
    </div>
  );
}
