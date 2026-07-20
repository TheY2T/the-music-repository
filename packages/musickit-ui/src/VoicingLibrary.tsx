import { playTone } from '@TheY2T/tmr-music-core/audio';
import { keyLayout } from '@TheY2T/tmr-music-core/keyboard';
import {
  CHORDS,
  chordsByLevel,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
} from '@TheY2T/tmr-music-core/music-theory';
import { buildPianoVoicings } from '@TheY2T/tmr-music-core/piano-voicings';
import { useLevel } from '@TheY2T/tmr-music-core/use-level';
import { Button, Card, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import LevelToggle from './LevelToggle';

// Fixed 3-octave diagram (C3–B5) so voicings stay comparable across selections. Geometry from the
// shared keyboard helper (ADR 0025).
const {
  whiteMidis: WHITE_MIDIS,
  blackMidis: BLACK_MIDIS,
  whiteWidthPct: WHITE_WIDTH_PCT,
} = keyLayout(48, 36);

function VoicingKeyboard({ midis, flats }: { midis: Set<number>; flats: boolean }) {
  return (
    <div className="relative flex h-28 select-none rounded-md border border-border bg-neutral-100 p-1">
      {WHITE_MIDIS.map((midi) => {
        const on = midis.has(midi);
        return (
          <button
            type="button"
            key={midi}
            aria-label={`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`}
            onClick={() => playTone(midiToFrequency(midi))}
            style={{ width: `${WHITE_WIDTH_PCT}%` }}
            className={`relative flex items-end justify-center rounded-b border border-neutral-300 pb-1 text-[10px] ${
              on ? 'bg-blue-300 text-blue-950' : 'bg-white text-neutral-400'
            }`}
          >
            {on ? pitchName(midi % 12, flats) : null}
          </button>
        );
      })}
      {BLACK_MIDIS.map(({ midi, afterWhiteIndex }) => {
        const on = midis.has(midi);
        return (
          <button
            type="button"
            key={midi}
            aria-label={`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`}
            onClick={() => playTone(midiToFrequency(midi))}
            style={{
              left: `${(afterWhiteIndex + 1) * WHITE_WIDTH_PCT}%`,
              width: `${WHITE_WIDTH_PCT * 0.62}%`,
              transform: 'translateX(-50%)',
            }}
            className={`absolute top-1 z-10 flex h-[60%] items-end justify-center rounded-b pb-0.5 text-[8px] ${
              on ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {on ? pitchName(midi % 12, flats) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function VoicingLibrary() {
  const { level, setLevel } = useLevel();
  const [root, setRoot] = useState(0);
  const [chordKey, setChordKey] = useState('major-7');

  const chordChoices = chordsByLevel(level);
  // Keep the selection valid when the level narrows past it.
  useEffect(() => {
    if (!chordChoices.some((c) => c.key === chordKey)) {
      setChordKey(chordChoices[0]?.key ?? 'major');
    }
  }, [chordChoices, chordKey]);

  const chord = CHORDS.find((c) => c.key === chordKey) ?? CHORDS[0];
  const flats = [1, 3, 5, 8, 10].includes(root);
  const rootMidi = 60 + root; // root in the C4 octave
  const voicings = buildPianoVoicings(rootMidi, chord.intervals);
  const chordLabel = `${pitchName(root, flats)} ${chord.name}`;

  function playBlock(midis: number[]) {
    for (const midi of midis) {
      playTone(midiToFrequency(midi), 1.1);
    }
  }
  function playArp(midis: number[]) {
    midis.forEach((midi, i) => {
      window.setTimeout(() => playTone(midiToFrequency(midi), 0.6), i * 180);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
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
            Chord
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
        <div className="ml-auto text-sm text-muted-foreground">
          Voicings of <span className="font-medium text-foreground">{chordLabel}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {voicings.map((voicing) => (
          <Card key={voicing.key} className="space-y-2 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{voicing.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {voicing.midis.map((m) => pitchName(m % 12, flats)).join(' ')}
              </span>
            </div>
            <VoicingKeyboard midis={new Set(voicing.midis)} flats={flats} />
            <p className="text-xs text-muted-foreground">{voicing.description}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="h-auto py-1 text-xs"
                onClick={() => playBlock(voicing.midis)}
              >
                <Icon name="play" className="size-4" />
                Play
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-auto py-1 text-xs"
                onClick={() => playArp(voicing.midis)}
              >
                ↗ Arpeggiate
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Every voicing uses the same chord tones in a different arrangement — compare the shapes on
        the keyboard and hear how the spread changes the colour. Click any lit key to hear that
        note.
      </p>
    </div>
  );
}
