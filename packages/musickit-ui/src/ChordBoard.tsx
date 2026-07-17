import { type Locale, t } from '@TheY2T/tmr-i18n';
import { chordToMidi } from '@TheY2T/tmr-music-core/embeds';
import { useToolInstrument } from '@TheY2T/tmr-music-core/instrument-choice';
import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import { playNote } from '@TheY2T/tmr-music-core/soundfont';
import { cn } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import InstrumentLoading from './InstrumentLoading';
import InstrumentPicker from './InstrumentPicker';

/**
 * A board of tappable chord cards (symbol + optional Roman-numeral label) that sound the chord's tones
 * when pressed — for diatonic sets, seventh-chord qualities, cadences, modes, etc. This island owns the
 * audio; the Pixi board ({@link ChordBoardScene}) is presentational. The `chord-board` content embed
 * (ADR 0029). English UI strings match the other tools.
 */
const loadScene = () => import('@TheY2T/tmr-music-core/pixi/chord-board-scene');

/** Sound a chord's tones with a gentle spread so the voicing is audible. */
function playChord(symbol: string): void {
  const notes = chordToMidi(symbol);
  if (!notes) return;
  notes.forEach((midi, i) => {
    window.setTimeout(() => playNote(midi, 1.4), i * 28);
  });
}

export default function ChordBoard({
  chords,
  labels,
  locale,
}: {
  chords: string[];
  labels?: string[];
  locale: Locale;
}) {
  const [active, setActive] = useState(-1);
  const items = chords.map((symbol, i) => ({ symbol, label: labels?.[i] }));

  const press = (i: number) => {
    setActive(i);
    playChord(chords[i]);
  };

  const { instrument, setInstrument, ready } = useToolInstrument('piano');
  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <InstrumentPicker value={instrument} onChange={setInstrument} />
      </div>
      <PixiCanvas
        ariaLabel={t(locale, 'embed.chordBoard')}
        loader={loadScene}
        sceneProps={{ items, active, onPress: press }}
        containerClassName="h-28 w-full rounded-lg border border-border bg-card"
        fallback={
          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <button
                key={`${item.symbol}-${i}`}
                type="button"
                onClick={() => press(i)}
                className={cn(
                  'flex min-w-16 flex-col items-center gap-0.5 rounded-lg border border-border p-2 transition-colors hover:bg-accent/15',
                  active === i && 'border-ring bg-accent/20',
                )}
              >
                {item.label ? (
                  <span className="font-serif text-xs italic text-muted-foreground">
                    {item.label}
                  </span>
                ) : null}
                <span className="font-semibold">{item.symbol}</span>
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}
