import { Button, Card, Icon, Input, Select } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  analyzeChordInKey,
  CHORDS,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
  reharmonizations,
} from '@/lib/music-theory';
import {
  deleteRemoteProgression,
  listRemoteProgressions,
  saveRemoteProgression,
} from '@/lib/progressions-api';
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

/**
 * @param syncEnabled When true (signed-in + `personalization.saved-progressions` flag), saved
 *   progressions live on the user's account via the API; otherwise they persist to localStorage.
 */
export default function ChordAnalyzer({ syncEnabled = false }: { syncEnabled?: boolean }) {
  const [keyRoot, setKeyRoot] = useState(0);
  const [chords, setChords] = useState<ProgChord[]>(PRESETS[0].chords);
  const [addRoot, setAddRoot] = useState(0);
  const [addQuality, setAddQuality] = useState('major');
  const [saved, setSaved] = useState<SavedProgression[]>([]);
  const [saveName, setSaveName] = useState('');
  const [reharmIndex, setReharmIndex] = useState<number | null>(null);

  useEffect(() => {
    if (syncEnabled) {
      listRemoteProgressions().then(setSaved);
    } else {
      setSaved(listSaved());
    }
  }, [syncEnabled]);

  async function persistSave(p: SavedProgression) {
    if (syncEnabled) {
      await saveRemoteProgression(p);
      setSaved(await listRemoteProgressions());
    } else {
      setSaved(saveProgression(p));
    }
  }
  async function persistDelete(name: string) {
    if (syncEnabled) {
      await deleteRemoteProgression(name);
      setSaved(await listRemoteProgressions());
    } else {
      setSaved(deleteProgression(name));
    }
  }

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
          <Select
            value={keyRoot}
            onChange={(e) => setKeyRoot(Number(e.target.value))}
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
          <span className="block font-medium">Preset</span>
          <Select
            onChange={(e) => {
              const preset = PRESETS.find((p) => p.key === e.target.value);
              if (preset) {
                setKeyRoot(preset.keyRoot);
                setChords(preset.chords);
              }
            }}
            className="h-auto w-auto px-2 py-1"
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
          </Select>
        </label>
      </div>

      <Card className="flex flex-wrap items-end gap-2 p-3">
        <span className="text-sm font-medium">Add chord:</span>
        <Select
          value={addRoot}
          onChange={(e) => setAddRoot(Number(e.target.value))}
          className="h-auto w-auto px-2 py-1"
        >
          {ROOT_CHOICES.map((pc) => (
            <option key={pc} value={pc}>
              {pitchName(pc)}
            </option>
          ))}
        </Select>
        <Select
          value={addQuality}
          onChange={(e) => setAddQuality(e.target.value)}
          className="h-auto w-auto px-2 py-1"
        >
          {CHORDS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={() => setChords((cs) => [...cs, { root: addRoot, quality: addQuality }])}
        >
          Add
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setChords([])}>
          Clear
        </Button>
      </Card>

      {chords.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {chords.map((c, i) => {
              const a = analyzeChordInKey(keyRoot, c.root, c.quality);
              const isOpen = reharmIndex === i;
              return (
                <div
                  key={`${c.root}-${c.quality}-${i}`}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border p-3 ${
                    isOpen ? 'border-primary' : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => play(c)}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <span className={`text-lg font-bold ${ROLE_COLOR[a.role] ?? ''}`}>
                      {a.roman}
                    </span>
                    <span className="text-sm">{chordName(c)}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.role}
                      {a.diatonic ? '' : ' · borrowed'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReharmIndex(isOpen ? null : i)}
                    className="mt-1 text-xs text-muted-foreground underline"
                  >
                    {isOpen ? 'close' : '≈ reharmonize'}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={playAll}>
              <Icon name="play" className="size-4" />
              Play progression
            </Button>
            <span className="self-center font-mono text-sm text-muted-foreground">
              {chords.map((c) => analyzeChordInKey(keyRoot, c.root, c.quality).roman).join(' – ')}
            </span>
          </div>

          {reharmIndex !== null && chords[reharmIndex] ? (
            <div className="space-y-2 rounded-lg border border-primary/50 bg-muted/40 p-3">
              <p className="text-sm font-medium">
                Reharmonize <strong>{chordName(chords[reharmIndex])}</strong> — try a substitution:
              </p>
              <div className="flex flex-wrap gap-2">
                {reharmonizations(
                  keyRoot,
                  chords[reharmIndex].root,
                  chords[reharmIndex].quality,
                ).map((s) => {
                  const sub: ProgChord = { root: s.root, quality: s.quality };
                  const roman = analyzeChordInKey(keyRoot, sub.root, sub.quality).roman;
                  return (
                    <div
                      key={`${s.label}-${s.root}-${s.quality}`}
                      className="flex flex-col gap-1 rounded-md border border-border bg-background p-2"
                    >
                      <span className="text-xs font-semibold">{s.label}</span>
                      <span className="text-sm">
                        {chordName(sub)} <span className="text-muted-foreground">({roman})</span>
                      </span>
                      <span className="max-w-48 text-xs text-muted-foreground">
                        {s.description}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => play(sub)}
                          className="text-xs underline"
                        >
                          hear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChords((cs) => cs.map((c, i) => (i === reharmIndex ? sub : c)));
                            setReharmIndex(null);
                          }}
                          className="text-xs font-medium text-primary underline"
                        >
                          apply
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Add chords to see their Roman numerals.</p>
      )}

      {/* Save / load (localStorage) */}
      <Card className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Save progression:</span>
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Name"
            className="h-auto w-auto px-2 py-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (saveName.trim() && chords.length) {
                persistSave({ name: saveName.trim(), keyRoot, chords });
                setSaveName('');
              }
            }}
          >
            Save
          </Button>
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
                  onClick={() => persistDelete(p.name)}
                  className="text-xs text-muted-foreground underline"
                >
                  delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            {syncEnabled
              ? 'Saved progressions sync to your account.'
              : 'Saved progressions persist in this browser.'}
          </p>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Each chord's <strong>Roman numeral</strong> and <strong>function</strong> (Tonic /
        Predominant / Dominant) within the key — non-diatonic chords are flagged "borrowed". Colour
        = function.
      </p>
    </div>
  );
}
