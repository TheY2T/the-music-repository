import { Button, Card, Icon, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { CHORDS, midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

// Fixed 3-octave diagram (C3–B5) so voicings stay comparable across selections.
const KB_START = 48;
const KB_COUNT = 36;
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);
const KB_MIDIS = Array.from({ length: KB_COUNT }, (_, i) => KB_START + i);
const isBlack = (midi: number) => BLACK_PCS.has(midi % 12);
const WHITE_MIDIS = KB_MIDIS.filter((m) => !isBlack(m));
const BLACK_MIDIS = KB_MIDIS.filter(isBlack).map((midi) => ({
  midi,
  afterWhiteIndex: KB_MIDIS.filter((m) => !isBlack(m) && m < midi).length - 1,
}));
const WHITE_WIDTH_PCT = 100 / WHITE_MIDIS.length;

interface Voicing {
  key: string;
  name: string;
  description: string;
  /** MIDI notes, low to high. */
  midis: number[];
}

/** Rotate the lowest `n` notes up an octave (root position → nth inversion). */
function invert(voicing: number[], n: number): number[] {
  const out = [...voicing].sort((a, b) => a - b);
  for (let k = 0; k < n; k += 1) {
    const low = out.shift();
    if (low !== undefined) {
      out.push(low + 12);
    }
  }
  return out.sort((a, b) => a - b);
}

/** Drop the `fromTop`-th voice (counting from the top) down an octave. */
function drop(voicing: number[], fromTop: number): number[] {
  const asc = [...voicing].sort((a, b) => a - b);
  const index = asc.length - fromTop;
  asc[index] -= 12;
  return asc.sort((a, b) => a - b);
}

function buildVoicings(rootMidi: number, intervals: number[]): Voicing[] {
  const close = intervals.map((i) => rootMidi + i);
  const list: Voicing[] = [
    {
      key: 'close',
      name: 'Close (root position)',
      description: 'Chord tones stacked within an octave — the plain shape.',
      midis: close,
    },
    {
      key: 'inv1',
      name: '1st inversion',
      description: 'The 3rd is in the bass.',
      midis: invert(close, 1),
    },
    {
      key: 'inv2',
      name: '2nd inversion',
      description: 'The 5th is in the bass.',
      midis: invert(close, 2),
    },
  ];
  if (intervals.length === 4) {
    list.push({
      key: 'inv3',
      name: '3rd inversion',
      description: 'The 7th is in the bass.',
      midis: invert(close, 3),
    });
    list.push({
      key: 'drop2',
      name: 'Drop 2',
      description: 'Second voice from the top dropped an octave — a rich, spread jazz voicing.',
      midis: drop(close, 2),
    });
    list.push({
      key: 'drop3',
      name: 'Drop 3',
      description: 'Third voice from the top dropped an octave — even wider.',
      midis: drop(close, 3),
    });
    list.push({
      key: 'shell',
      name: 'Shell (1–3–7)',
      description: 'Root, 3rd and 7th — the essential colour, no 5th. The comping staple.',
      midis: [rootMidi + intervals[0], rootMidi + intervals[1], rootMidi + intervals[3]],
    });
  } else {
    list.push({
      key: 'open',
      name: 'Open (spread triad)',
      description: 'Middle voice up an octave for an open, ringing sound.',
      midis: [rootMidi + intervals[0], rootMidi + intervals[2], rootMidi + intervals[1] + 12],
    });
  }
  return list;
}

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
  const [root, setRoot] = useState(0);
  const [chordKey, setChordKey] = useState('major-7');

  const chord = CHORDS.find((c) => c.key === chordKey) ?? CHORDS[0];
  const flats = [1, 3, 5, 8, 10].includes(root);
  const rootMidi = 60 + root; // root in the C4 octave
  const voicings = buildVoicings(rootMidi, chord.intervals);
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
            {CHORDS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
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
