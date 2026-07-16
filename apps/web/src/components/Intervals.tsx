import { type Locale, t } from '@TheY2T/tmr-i18n';
import { cn } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import InstrumentLoading from '@/components/InstrumentLoading';
import { PixiCanvas } from '@/components/PixiCanvas';
import { noteNameToPitchClass } from '@/lib/embeds';
import { pitchName } from '@/lib/music-theory';
import { playNote } from '@/lib/soundfont';
import { useInstrumentReady } from '@/lib/use-instrument-ready';

/**
 * An interval reference: the twelve intervals above a root as tappable cards (short name + the note it
 * lands on). Pressing one plays the root then the upper note so you hear the interval. This island owns
 * the audio; it reuses the Pixi card-row scene ({@link ChordBoardScene}). The `intervals` content embed
 * (ADR 0029). English UI strings match the other tools.
 */
const loadScene = () => import('@/lib/pixi/chord-board-scene');

const NAMES = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

export default function Intervals({ root = 'C', locale }: { root?: string; locale: Locale }) {
  const [active, setActive] = useState(-1);
  const rootPc = noteNameToPitchClass(root) ?? 0;
  const rootMidi = 60 + rootPc; // C4-based
  const items = NAMES.map((name, i) => ({ symbol: name, label: pitchName((rootPc + i) % 12) }));

  const press = (i: number) => {
    setActive(i);
    playNote(rootMidi, 0.8);
    window.setTimeout(() => playNote(rootMidi + i, 0.8), 420);
  };

  const { ready } = useInstrumentReady();
  if (!ready) return <InstrumentLoading />;

  return (
    <PixiCanvas
      ariaLabel={t(locale, 'embed.intervals')}
      loader={loadScene}
      sceneProps={{ items, active, onPress: press }}
      containerClassName="h-28 w-full rounded-lg border border-border bg-card"
      fallback={
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => press(i)}
              className={cn(
                'flex min-w-14 flex-col items-center gap-0.5 rounded-lg border border-border p-2 transition-colors hover:bg-accent/15',
                active === i && 'border-ring bg-accent/20',
              )}
            >
              <span className="font-semibold">{item.symbol}</span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      }
    />
  );
}
