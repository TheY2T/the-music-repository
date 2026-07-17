import { useToolInstrument } from '@TheY2T/tmr-music-core/instrument-choice';
import { keyLayout } from '@TheY2T/tmr-music-core/keyboard';
import {
  CHORDS,
  chordsByLevel,
  FRET_MARKERS,
  intervalLabel,
  pitchName,
  ROOT_CHOICES,
  SCALES,
  STANDARD_TUNING,
  STANDARD_TUNING_NAMES,
  scalePitchClasses,
  scalesByLevel,
} from '@TheY2T/tmr-music-core/music-theory';
import { playNote } from '@TheY2T/tmr-music-core/soundfont';
import { useLevel } from '@TheY2T/tmr-music-core/use-level';
import { cn, SegmentedToggle, Select } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import InstrumentLoading from './InstrumentLoading';
import InstrumentPicker from './InstrumentPicker';
import LevelToggle from './LevelToggle';

// Two-octave keyboard (C3–C5) + a 15-fret neck, both lit with the same pitch classes so learners can
// see a scale or chord map from piano to guitar at a glance.
const KB = keyLayout(48, 25);
const FRET_COUNT = 15;
const frets = Array.from({ length: FRET_COUNT + 1 }, (_, f) => f);

type Mode = 'scale' | 'chord';
const MODE_OPTIONS = [
  { value: 'scale' as Mode, label: 'Scale' },
  { value: 'chord' as Mode, label: 'Chord' },
];

export default function ScaleHeatmap() {
  const { level, setLevel } = useLevel();
  const [root, setRoot] = useState(0);
  const [mode, setMode] = useState<Mode>('scale');
  const [scaleKey, setScaleKey] = useState('major');
  const [chordKey, setChordKey] = useState('major');

  const scaleChoices = scalesByLevel(level);
  const chordChoices = chordsByLevel(level);
  useEffect(() => {
    if (!scaleChoices.some((s) => s.key === scaleKey)) setScaleKey(scaleChoices[0]?.key ?? 'major');
    if (!chordChoices.some((c) => c.key === chordKey)) setChordKey(chordChoices[0]?.key ?? 'major');
  }, [scaleChoices, chordChoices, scaleKey, chordKey]);

  const flats = [1, 3, 5, 8, 10].includes(root);
  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const chord = CHORDS.find((c) => c.key === chordKey) ?? CHORDS[0];
  const intervals = mode === 'scale' ? scale.intervals : chord.intervals;
  const pcs = scalePitchClasses(root, intervals);
  const label = `${pitchName(root, flats)} ${mode === 'scale' ? scale.name : chord.name}`;

  const on = (midi: number) => pcs.has(((midi % 12) + 12) % 12);
  const isRoot = (midi: number) => ((midi % 12) + 12) % 12 === root;

  const { instrument, setInstrument, ready } = useToolInstrument('piano');
  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <InstrumentPicker value={instrument} onChange={setInstrument} />
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
        <div className="space-y-1 text-sm">
          <span className="block font-medium">Show</span>
          <SegmentedToggle
            options={MODE_OPTIONS}
            value={mode}
            onValueChange={setMode}
            aria-label="Scale or chord"
          />
        </div>
        {mode === 'scale' ? (
          <label className="space-y-1 text-sm">
            <span className="block font-medium" data-help="scales">
              Scale
            </span>
            <Select
              value={scaleKey}
              onChange={(e) => setScaleKey(e.target.value)}
              className="h-auto w-auto px-2 py-1"
            >
              {scaleChoices.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
        ) : (
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
        )}
        <LevelToggle level={level} onChange={setLevel} />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold">{label}</h2>
        <p className="text-sm text-muted-foreground">
          {intervals
            .map((i) => `${pitchName((root + i) % 12, flats)} (${intervalLabel(i)})`)
            .join('  ·  ')}
        </p>
      </div>

      {/* Piano */}
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">Piano</div>
        <div className="relative flex h-32 select-none rounded-md border border-border bg-neutral-100 p-1">
          {KB.whiteMidis.map((midi) => (
            <button
              type="button"
              key={midi}
              aria-label={`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`}
              onClick={() => playNote(midi)}
              style={{ width: `${KB.whiteWidthPct}%` }}
              className={cn(
                'relative flex items-end justify-center rounded-b border border-neutral-300 pb-1 text-[10px]',
                isRoot(midi)
                  ? 'bg-primary text-primary-foreground'
                  : on(midi)
                    ? 'bg-accent/40 text-foreground'
                    : 'bg-white text-neutral-400',
              )}
            >
              {on(midi) ? pitchName(midi % 12, flats) : null}
            </button>
          ))}
          {KB.blackMidis.map(({ midi, afterWhiteIndex }) => (
            <button
              type="button"
              key={midi}
              aria-label={`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`}
              onClick={() => playNote(midi)}
              style={{
                left: `${(afterWhiteIndex + 1) * KB.whiteWidthPct}%`,
                width: `${KB.whiteWidthPct * 0.62}%`,
                transform: 'translateX(-50%)',
              }}
              className={cn(
                'absolute top-1 z-10 flex h-[60%] items-end justify-center rounded-b pb-0.5 text-[8px]',
                isRoot(midi)
                  ? 'bg-primary text-primary-foreground'
                  : on(midi)
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-neutral-800 text-neutral-300',
              )}
            >
              {on(midi) ? pitchName(midi % 12, flats) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Guitar */}
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">Guitar</div>
        <div className="overflow-x-auto">
          <table className="border-collapse text-center text-[11px]">
            <thead>
              <tr>
                <th className="w-6" />
                {frets.map((f) => (
                  <th key={f} className="w-10 pb-1 font-normal text-muted-foreground">
                    {f}
                    {FRET_MARKERS.has(f) ? <span className="block leading-none">•</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDARD_TUNING.map((open, stringIndex) => (
                <tr key={`${STANDARD_TUNING_NAMES[stringIndex]}-${open}`}>
                  <th className="pr-1 text-right font-mono text-muted-foreground">
                    {STANDARD_TUNING_NAMES[stringIndex]}
                  </th>
                  {frets.map((f) => {
                    const midi = open + f;
                    return (
                      <td
                        key={f}
                        className={cn(
                          'h-8 border border-border',
                          f === 0 && 'border-r-2 border-r-muted-foreground',
                        )}
                      >
                        <button
                          type="button"
                          aria-label={`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`}
                          onClick={() => playNote(midi)}
                          className={cn(
                            'flex h-full w-full items-center justify-center',
                            isRoot(midi)
                              ? 'bg-primary font-semibold text-primary-foreground'
                              : on(midi)
                                ? 'bg-accent/40 text-foreground'
                                : 'hover:bg-muted',
                          )}
                        >
                          {on(midi) ? pitchName(midi % 12, flats) : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The same {mode} lit on both instruments — the root is filled, the other tones tinted. See
        how a shape on the keys maps onto the neck, and click any note to hear it. Raise the level
        for modes, extended and altered options.
      </p>
    </div>
  );
}
