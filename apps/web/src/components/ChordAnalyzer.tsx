import { useEffect, useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  analyzeChordInKey,
  CHORDS,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
} from '@/lib/music-theory';
import {
  deleteProgression,
  listSaved,
  type SavedProgression,
  saveProgression,
} from '@/lib/saved-progressions';

interface ProgChord {
  root: number;
  quality: string;
}

const PRESETS: { key: string; label: string; keyRoot: number; chords: ProgChord[] }[] = [
  {
    key: 'pop',
    label: 'C: I–V–vi–IV',
    keyRoot: 0,
    chords: [
      { root: 0, quality: 'major' },
      { root: 7, quality: 'major' },
      { root: 9, quality: 'minor' },
      { root: 5, quality: 'major' },
    ],
  },
  {
    key: 'jazz',
    label: 'C: ii–V–I',
    keyRoot: 0,
    chords: [
      { root: 2, quality: 'minor-7' },
      { root: 7, quality: 'dominant-7' },
      { root: 0, quality: 'major-7' },
    ],
  },
];

const ROLE_COLOR: Record<string, string> = {
  Tonic: 'text-blue-600 dark:text-blue-400',
  Predominant: 'text-amber-600 dark:text-amber-400',
  Dominant: 'text-red-600 dark:text-red-400',
};

export default function ChordAnalyzer() {
  const [keyRoot, setKeyRoot] = useState(0);
  const [chords, setChords] = useState<ProgChord[]>(PRESETS[0].chords);
  const [addRoot, setAddRoot] = useState(0);
  const [addQuality, setAddQuality] = useState('major');
  const [saved, setSaved] = useState<SavedProgression[]>([]);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    setSaved(listSaved());
  }, []);

  const flats = [1, 3, 5, 8, 10].includes(keyRoot);

  function chordName(c: ProgChord): string {
    const short = CHORDS.find((q) => q.key === c.quality)?.name ?? '';
    return `${pitchName(c.root, flats)} ${short}`;
  }
  function chordMidis(c: ProgChord): number[] {
    const intervals = CHORDS.find((q) => q.key === c.quality)?.intervals ?? [0, 4, 7];
    return intervals.map((i) => 60 + c.root + i);
  }

  function play(c: ProgChord) {
    for (const midi of chordMidis(c)) {
      playTone(midiToFrequency(midi), 1.1);
    }
  }
  function playAll() {
    chords.forEach((c, i) => {
      window.setTimeout(() => play(c), i * 800);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="scales">
            Key (major)
          </span>
          <select
            value={keyRoot}
            onChange={(e) => setKeyRoot(Number(e.target.value))}
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
          <span className="block font-medium">Preset</span>
          <select
            onChange={(e) => {
              const preset = PRESETS.find((p) => p.key === e.target.value);
              if (preset) {
                setKeyRoot(preset.keyRoot);
                setChords(preset.chords);
              }
            }}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            defaultValue=""
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

      {chords.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {chords.map((c, i) => {
              const a = analyzeChordInKey(keyRoot, c.root, c.quality);
              return (
                <button
                  key={`${c.root}-${c.quality}-${i}`}
                  type="button"
                  onClick={() => play(c)}
                  className="flex flex-col items-center gap-0.5 rounded-lg border border-border p-3 hover:bg-muted"
                >
                  <span className={`text-lg font-bold ${ROLE_COLOR[a.role] ?? ''}`}>{a.roman}</span>
                  <span className="text-sm">{chordName(c)}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.role}
                    {a.diatonic ? '' : ' · borrowed'}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={playAll}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              ▶ Play progression
            </button>
            <span className="self-center font-mono text-sm text-muted-foreground">
              {chords.map((c) => analyzeChordInKey(keyRoot, c.root, c.quality).roman).join(' – ')}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Add chords to see their Roman numerals.</p>
      )}

      {/* Save / load (localStorage) */}
      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Save progression:</span>
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Name"
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (saveName.trim() && chords.length) {
                setSaved(saveProgression({ name: saveName.trim(), keyRoot, chords }));
                setSaveName('');
              }
            }}
            className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
          >
            Save
          </button>
        </div>
        {saved.length ? (
          <ul className="space-y-1 text-sm">
            {saved.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setKeyRoot(p.keyRoot);
                    setChords(p.chords);
                  }}
                  className="underline"
                >
                  {p.name}
                </button>
                <span className="text-xs text-muted-foreground">
                  {pitchName(p.keyRoot)} · {p.chords.length} chords
                </span>
                <button
                  type="button"
                  onClick={() => setSaved(deleteProgression(p.name))}
                  className="text-xs text-muted-foreground underline"
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Saved progressions persist in this browser.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Each chord's <strong>Roman numeral</strong> and <strong>function</strong> (Tonic /
        Predominant / Dominant) within the key — non-diatonic chords are flagged "borrowed". Colour
        = function.
      </p>
    </div>
  );
}
