import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import LevelToggle from '@/components/LevelToggle';
import { CHORDS, chordsByLevel, intervalLabel, pitchName, ROOT_CHOICES } from '@/lib/music-theory';
import { playNote } from '@/lib/soundfont';
import { useLevel } from '@/lib/use-level';

const ROOT_MIDI = 60; // C4 reference octave

export default function ChordBuilder() {
  const { level, setLevel } = useLevel();
  const [root, setRoot] = useState(0);
  const [chordKey, setChordKey] = useState('major');

  const chordChoices = chordsByLevel(level);
  // Keep the selection valid when the level narrows past it.
  useEffect(() => {
    if (!chordChoices.some((c) => c.key === chordKey)) {
      setChordKey(chordChoices[0]?.key ?? 'major');
    }
  }, [chordChoices, chordKey]);

  const chord = CHORDS.find((c) => c.key === chordKey) ?? CHORDS[0];
  const flats = [1, 3, 5, 8, 10].includes(root);
  const tones = chord.intervals.map((interval) => ({
    name: pitchName((root + interval) % 12, flats),
    degree: intervalLabel(interval),
    midi: ROOT_MIDI + root + interval,
  }));

  function playBlock() {
    for (const tone of tones) {
      playNote(tone.midi, 1.1);
    }
  }

  function playArpeggio() {
    tones.forEach((tone, index) => {
      window.setTimeout(() => playNote(tone.midi, 0.7), index * 180);
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
        <Button type="button" onClick={playBlock}>
          <Icon name="play" className="size-4" />
          Play chord
        </Button>
        <Button type="button" variant="outline" onClick={playArpeggio}>
          Arpeggiate
        </Button>
      </div>
    </div>
  );
}
