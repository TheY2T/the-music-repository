import type { Locale } from '@TheY2T/tmr-i18n';
import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import AlphaTexScore from '@/components/score/AlphaTexScore';
import { playTone } from '@/lib/audio';
import { midiToFrequency, scalePitchClasses } from '@/lib/music-theory';
import { melodyToAlphaTex } from '@/lib/score/alphatex';

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
// ASCII note names so the generated pitch names parse cleanly into alphaTex (c#4 / bb3).
const ASCII_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ASCII_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Common major keys (≤3 accidentals). `ks` is the alphaTex key-signature token; `flats` picks the
// enharmonic spelling so notes match the signature (F♯ in G, B♭ in F).
const KEYS = [
  { key: 'c', label: 'C major', root: 0, flats: false },
  { key: 'g', label: 'G major', root: 7, flats: false },
  { key: 'd', label: 'D major', root: 2, flats: false },
  { key: 'a', label: 'A major', root: 9, flats: false },
  { key: 'f', label: 'F major', root: 5, flats: true },
  { key: 'bb', label: 'B♭ major', root: 10, flats: true },
  { key: 'eb', label: 'E♭ major', root: 3, flats: true },
];

// alphaTex clef token + the MIDI window the melody is drawn from.
const CLEFS = [
  { key: 'g2', label: 'Treble', min: 60, max: 84 },
  { key: 'f4', label: 'Bass', min: 40, max: 64 },
];

const LENGTHS = [4, 8, 12];
const MOTIONS = [
  { key: 'steps', label: 'Steps only', maxLeap: 1 },
  { key: 'leaps', label: 'Small leaps', maxLeap: 3 },
];

interface PoolNote {
  name: string;
  midi: number;
}

/** The diatonic notes of a major key within a clef's MIDI window, low → high. */
function buildPool(root: number, flats: boolean, min: number, max: number): PoolNote[] {
  const pcs = scalePitchClasses(root, MAJOR_INTERVALS);
  const names = flats ? ASCII_FLAT : ASCII_SHARP;
  const pool: PoolNote[] = [];
  for (let midi = min; midi <= max; midi += 1) {
    if (pcs.has(midi % 12)) {
      pool.push({ name: `${names[midi % 12]}${Math.floor(midi / 12) - 1}`, midi });
    }
  }
  return pool;
}

/** A stepwise / small-leap melody walking the scale-note pool. */
function generateMelody(pool: PoolNote[], count: number, maxLeap: number): PoolNote[] {
  if (pool.length === 0) return [];
  const melody: PoolNote[] = [];
  let position = Math.min(
    pool.length - 1,
    2 + Math.floor(Math.random() * Math.max(1, pool.length - 5)),
  );
  for (let i = 0; i < count; i += 1) {
    melody.push(pool[position]);
    let leap = 0;
    while (leap === 0) {
      leap = Math.floor(Math.random() * (2 * maxLeap + 1)) - maxLeap;
    }
    position = Math.max(0, Math.min(pool.length - 1, position + leap));
  }
  return melody;
}

export default function SightReadingTrainer({ locale }: { locale: Locale }) {
  const [keyIndex, setKeyIndex] = useState(0);
  const [clefIndex, setClefIndex] = useState(0);
  const [length, setLength] = useState(8);
  const [motion, setMotion] = useState('steps');
  const [showLabels, setShowLabels] = useState(false);
  const [seed, setSeed] = useState(0);
  const [melody, setMelody] = useState<PoolNote[]>([]);

  const keyDef = KEYS[keyIndex];
  const clefDef = CLEFS[clefIndex];

  useEffect(() => {
    const maxLeap = MOTIONS.find((m) => m.key === motion)?.maxLeap ?? 1;
    const pool = buildPool(keyDef.root, keyDef.flats, clefDef.min, clefDef.max);
    setMelody(generateMelody(pool, length, maxLeap));
    setShowLabels(false);
  }, [length, motion, seed, keyDef, clefDef]);

  function play() {
    melody.forEach((note, index) => {
      window.setTimeout(() => playTone(midiToFrequency(note.midi), 0.5), index * 500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="sight-reading">
            Key
          </span>
          <Select
            value={keyIndex}
            onChange={(e) => setKeyIndex(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {KEYS.map((k, i) => (
              <option key={k.key} value={i}>
                {k.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Clef</span>
          <Select
            value={clefIndex}
            onChange={(e) => setClefIndex(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {CLEFS.map((c, i) => (
              <option key={c.key} value={i}>
                {c.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Notes</span>
          <Select
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {LENGTHS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Motion</span>
          <Select
            value={motion}
            onChange={(e) => setMotion(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {MOTIONS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Reveal note names
        </label>
      </div>

      {melody.length ? (
        <AlphaTexScore
          tex={melodyToAlphaTex(
            melody.map((n) => ({ name: n.name, beats: 1 })),
            {
              title: 'Sight-reading',
              key: keyDef.key,
              clef: clefDef.key,
              lyrics: showLabels ? melody.map((n) => n.name) : undefined,
            },
          )}
          mode="standard"
          locale={locale}
          showPlay={false}
        />
      ) : null}

      <div className="flex gap-3">
        <Button type="button" onClick={play}>
          <Icon name="play" className="size-4" />
          Play
        </Button>
        <Button type="button" variant="outline" onClick={() => setSeed((s) => s + 1)}>
          <Icon name="refresh" className="size-4" />
          New melody
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Read the notes in {keyDef.label} ({clefDef.label.toLowerCase()} clef), sing or play them,
        then press Play to check — reveal the names if you get stuck.
      </p>
    </div>
  );
}
