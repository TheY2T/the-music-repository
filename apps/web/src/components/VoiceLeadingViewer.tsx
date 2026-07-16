import { Button, cn, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import InstrumentLoading from '@/components/InstrumentLoading';
import InstrumentPicker from '@/components/InstrumentPicker';
import LevelToggle from '@/components/LevelToggle';
import { useToolInstrument } from '@/lib/instrument-choice';
import { keyLayout } from '@/lib/keyboard';
import { CHORDS, chordsByLevel, pitchName, ROOT_CHOICES } from '@/lib/music-theory';
import { playNote } from '@/lib/soundfont';
import { useLevel } from '@/lib/use-level';
import { voiceLead, voiceMoves } from '@/lib/voice-leading';

const BASE = 60; // voice the first chord from C4
const KB = keyLayout(48, 25); // C3–C5

function noteName(midi: number, flats: boolean) {
  return `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;
}

function ChordSelect({
  label,
  root,
  onRoot,
  quality,
  onQuality,
  choices,
}: {
  label: string;
  root: number;
  onRoot: (v: number) => void;
  quality: string;
  onQuality: (v: string) => void;
  choices: typeof CHORDS;
}) {
  return (
    <div className="space-y-1 text-sm">
      <span className="block font-medium">{label}</span>
      <div className="flex gap-2">
        <Select
          value={root}
          onChange={(e) => onRoot(Number(e.target.value))}
          className="h-auto w-auto px-2 py-1"
        >
          {ROOT_CHOICES.map((pc) => (
            <option key={pc} value={pc}>
              {pitchName(pc)}
            </option>
          ))}
        </Select>
        <Select
          value={quality}
          onChange={(e) => onQuality(e.target.value)}
          className="h-auto w-auto px-2 py-1"
        >
          {choices.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function Keyboard({ lit, roots, flats }: { lit: Set<number>; roots: Set<number>; flats: boolean }) {
  return (
    <div className="relative flex h-24 select-none rounded-md border border-border bg-neutral-100 p-1">
      {KB.whiteMidis.map((midi) => {
        const on = lit.has(midi);
        return (
          <button
            type="button"
            key={midi}
            aria-label={noteName(midi, flats)}
            onClick={() => playNote(midi)}
            style={{ width: `${KB.whiteWidthPct}%` }}
            className={cn(
              'relative flex items-end justify-center rounded-b border border-neutral-300 pb-1 text-[9px]',
              roots.has(midi)
                ? 'bg-primary text-primary-foreground'
                : on
                  ? 'bg-accent/40 text-foreground'
                  : 'bg-white text-neutral-400',
            )}
          >
            {on ? pitchName(midi % 12, flats) : null}
          </button>
        );
      })}
      {KB.blackMidis.map(({ midi, afterWhiteIndex }) => {
        const on = lit.has(midi);
        return (
          <button
            type="button"
            key={midi}
            aria-label={noteName(midi, flats)}
            onClick={() => playNote(midi)}
            style={{
              left: `${(afterWhiteIndex + 1) * KB.whiteWidthPct}%`,
              width: `${KB.whiteWidthPct * 0.62}%`,
              transform: 'translateX(-50%)',
            }}
            className={cn(
              'absolute top-1 z-10 flex h-[58%] items-end justify-center rounded-b pb-0.5 text-[7px]',
              roots.has(midi)
                ? 'bg-primary text-primary-foreground'
                : on
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-neutral-800 text-neutral-300',
            )}
          >
            {on ? pitchName(midi % 12, flats) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function VoiceLeadingViewer() {
  const { level, setLevel } = useLevel();
  const { instrument, setInstrument, ready } = useToolInstrument('piano');
  const [rootA, setRootA] = useState(0);
  const [qualA, setQualA] = useState('major');
  const [rootB, setRootB] = useState(5);
  const [qualB, setQualB] = useState('major');

  const choices = chordsByLevel(level);
  useEffect(() => {
    if (!choices.some((c) => c.key === qualA)) setQualA(choices[0]?.key ?? 'major');
    if (!choices.some((c) => c.key === qualB)) setQualB(choices[0]?.key ?? 'major');
  }, [choices, qualA, qualB]);

  const chordA = CHORDS.find((c) => c.key === qualA) ?? CHORDS[0];
  const chordB = CHORDS.find((c) => c.key === qualB) ?? CHORDS[0];
  const fromMidis = chordA.intervals.map((i) => BASE + rootA + i);
  const toPcs = chordB.intervals.map((i) => rootB + i);
  const toMidis = voiceLead(fromMidis, toPcs);
  const moves = voiceMoves(fromMidis, toMidis);
  const flats = [1, 3, 5, 8, 10].includes(rootA) || [1, 3, 5, 8, 10].includes(rootB);

  function play(midis: number[]) {
    for (const m of midis) playNote(m, 1.4);
  }
  function playBoth() {
    play(fromMidis);
    window.setTimeout(() => play(toMidis), 1200);
  }

  if (!ready) return <InstrumentLoading />;

  const intervalLabel = (n: number) => (n === 0 ? 'held' : n > 0 ? `+${n}` : `${n}`);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <InstrumentPicker value={instrument} onChange={setInstrument} />
        <ChordSelect
          label="From chord"
          root={rootA}
          onRoot={setRootA}
          quality={qualA}
          onQuality={setQualA}
          choices={choices}
        />
        <ChordSelect
          label="To chord"
          root={rootB}
          onRoot={setRootB}
          quality={qualB}
          onQuality={setQualB}
          choices={choices}
        />
        <LevelToggle level={level} onChange={setLevel} />
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {pitchName(rootA, flats)} {chordA.name}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-auto py-1 text-xs"
              onClick={() => play(fromMidis)}
            >
              <Icon name="play" className="size-4" /> Play
            </Button>
          </div>
          <Keyboard
            lit={new Set(fromMidis)}
            roots={new Set(fromMidis.filter((m) => m % 12 === rootA))}
            flats={flats}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {pitchName(rootB, flats)} {chordB.name}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-auto py-1 text-xs"
              onClick={() => play(toMidis)}
            >
              <Icon name="play" className="size-4" /> Play
            </Button>
          </div>
          <Keyboard
            lit={new Set(toMidis)}
            roots={new Set(toMidis.filter((m) => m % 12 === rootB))}
            flats={flats}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {moves.map((m) => (
          <span
            key={`${m.from}-${m.to}`}
            className={cn(
              'rounded-md border px-2 py-1 text-xs',
              m.interval === 0
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-border text-muted-foreground',
            )}
          >
            {pitchName(m.from % 12, flats)} → {pitchName(m.to % 12, flats)}{' '}
            <span className="font-mono">({intervalLabel(m.interval)})</span>
          </span>
        ))}
      </div>

      <Button type="button" onClick={playBoth}>
        <Icon name="play" className="size-4" />
        Play the change
      </Button>

      <p className="text-xs text-muted-foreground">
        The smoothest way to move between the two chords: shared notes stay put (green), and the
        other voices step to the nearest chord tone. Compare it to jumping both chords to root
        position — this is why pianists and arrangers voice-lead. Raise the level for 7th-chord
        voice leading.
      </p>
    </div>
  );
}
