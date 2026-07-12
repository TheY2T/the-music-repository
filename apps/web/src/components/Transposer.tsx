import { useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  CHORDS,
  capoSuggestions,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
} from '@/lib/music-theory';

interface Chord {
  root: number;
  quality: string;
}

// Compact chord-symbol suffixes.
const SHORT: Record<string, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  'major-7': 'maj7',
  'minor-7': 'm7',
  'dominant-7': '7',
  'diminished-7': 'dim7',
};

const PRESETS: { key: string; label: string; chords: Chord[] }[] = [
  {
    key: 'pop',
    label: 'C–G–Am–F',
    chords: [
      { root: 0, quality: 'major' },
      { root: 7, quality: 'major' },
      { root: 9, quality: 'minor' },
      { root: 5, quality: 'major' },
    ],
  },
  {
    key: 'blues',
    label: 'E–A–B (blues)',
    chords: [
      { root: 4, quality: 'dominant-7' },
      { root: 9, quality: 'dominant-7' },
      { root: 11, quality: 'dominant-7' },
    ],
  },
];

function symbol(root: number, quality: string, flats: boolean): string {
  return `${pitchName(root, flats)}${SHORT[quality] ?? ''}`;
}

export default function Transposer() {
  const [chords, setChords] = useState<Chord[]>(PRESETS[0].chords);
  const [semitones, setSemitones] = useState(0);
  const [addRoot, setAddRoot] = useState(0);
  const [addQuality, setAddQuality] = useState('major');

  const flatsOrig = false;
  const transposed = chords.map((c) => ({
    root: (c.root + semitones + 12) % 12,
    quality: c.quality,
  }));
  // Flats spelling for the transposed key if its tonic is a flat key.
  const targetTonic = transposed[0]?.root ?? 0;
  const flatsNew = [1, 3, 5, 8, 10].includes(targetTonic);
  const capos = capoSuggestions(targetTonic);

  function play(list: Chord[]) {
    list.forEach((c, i) => {
      const intervals = CHORDS.find((q) => q.key === c.quality)?.intervals ?? [0, 4, 7];
      window.setTimeout(() => {
        for (const iv of intervals) {
          playTone(midiToFrequency(60 + c.root + iv), 0.9);
        }
      }, i * 700);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Preset</span>
          <select
            onChange={(e) => {
              const p = PRESETS.find((x) => x.key === e.target.value);
              if (p) {
                setChords(p.chords);
                setSemitones(0);
              }
            }}
            defaultValue=""
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="" disabled>
              — load —
            </option>
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="scales">
            Transpose
          </span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={-11}
              max={11}
              value={semitones}
              onChange={(e) => setSemitones(Number(e.target.value))}
              className="w-48"
              aria-label="Transpose semitones"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">
              {semitones > 0 ? `+${semitones}` : semitones} st
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
        <span className="text-sm font-medium">Add chord:</span>
        <select
          value={addRoot}
          onChange={(e) => setAddRoot(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {ROOT_CHOICES.map((pc) => (
            <option key={pc} value={pc}>
              {pitchName(pc)}
            </option>
          ))}
        </select>
        <select
          value={addQuality}
          onChange={(e) => setAddQuality(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {CHORDS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setChords((cs) => [...cs, { root: addRoot, quality: addQuality }])}
          className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setChords([])}
          className="rounded-md border border-border px-3 py-1 text-sm"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-sm text-muted-foreground">Original</span>
          {chords.map((c, i) => (
            <span
              key={`o${i}`}
              className="rounded-md border border-border px-3 py-1 font-mono text-sm"
            >
              {symbol(c.root, c.quality, flatsOrig)}
            </span>
          ))}
          <button type="button" onClick={() => play(chords)} className="text-sm underline">
            ▶
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-sm font-medium">Transposed</span>
          {transposed.map((c, i) => (
            <span
              key={`t${i}`}
              className="rounded-md border border-blue-500 bg-blue-500/10 px-3 py-1 font-mono text-sm font-semibold"
            >
              {symbol(c.root, c.quality, flatsNew)}
            </span>
          ))}
          <button type="button" onClick={() => play(transposed)} className="text-sm underline">
            ▶
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="text-sm font-medium" data-help="fretboard">
          Capo suggestions (guitar) — key of {pitchName(targetTonic, flatsNew)}
        </p>
        {capos.length ? (
          <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {capos.map((c) => (
              <li key={c.fret}>
                {c.fret === 0 ? 'No capo' : `Capo ${c.fret}`} → play open shapes in{' '}
                <span className="font-semibold text-foreground">{pitchName(c.shapeKey)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No easy capo within 7 frets.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Slide to transpose the whole progression; play either row to compare. Capo suggestions map
        the new key to easy open-chord shapes (C A G E D).
      </p>
    </div>
  );
}
