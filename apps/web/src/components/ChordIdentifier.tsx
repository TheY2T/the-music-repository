import { Icon } from '@TheY2T/tmr-ui';
import { useCallback, useState } from 'react';
import InstrumentLoading from '@/components/InstrumentLoading';
import InstrumentPicker from '@/components/InstrumentPicker';
import { useToolInstrument } from '@/lib/instrument-choice';
import { identifyChords, pitchName, ROOT_CHOICES } from '@/lib/music-theory';
import { playNote } from '@/lib/soundfont';
import { useMidiInput } from '@/lib/use-midi-input';

const ROOT_MIDI = 60;

export default function ChordIdentifier() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [midiHeld, setMidiHeld] = useState<Set<number>>(new Set());

  // Effective selection = manual toggles ∪ notes held on a MIDI keyboard.
  const effective = new Set<number>([...selected, ...midiHeld]);
  const matches = identifyChords(effective);
  const sorted = [...effective].sort((a, b) => a - b);

  // Live MIDI: held notes' pitch classes join the selection; detection updates in real time.
  const onMidiNote = useCallback((midiNote: number, isOn: boolean) => {
    const pc = midiNote % 12;
    setMidiHeld((prev) => {
      const next = new Set(prev);
      if (isOn) {
        next.add(pc);
      } else {
        next.delete(pc);
      }
      return next;
    });
    if (isOn) {
      playNote(midiNote, 0.6);
    }
  }, []);
  const midi = useMidiInput(onMidiNote);

  function toggle(pc: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pc)) {
        next.delete(pc);
      } else {
        next.add(pc);
      }
      return next;
    });
    playNote(ROOT_MIDI + pc, 0.5);
  }

  function playSelection() {
    for (const pc of sorted) {
      playNote(ROOT_MIDI + pc, 1.1);
    }
  }

  const { instrument, setInstrument, ready } = useToolInstrument('piano');
  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <InstrumentPicker value={instrument} onChange={setInstrument} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium" data-help="chords">
          Pick the notes
        </p>
        <div className="flex flex-wrap gap-2">
          {ROOT_CHOICES.map((pc) => (
            <button
              type="button"
              key={pc}
              onClick={() => toggle(pc)}
              aria-pressed={effective.has(pc)}
              className={`h-10 w-12 rounded-md border text-sm font-medium ${
                effective.has(pc)
                  ? 'border-blue-600 bg-blue-500 text-white'
                  : 'border-border hover:bg-muted'
              } ${midiHeld.has(pc) ? 'ring-2 ring-inset ring-green-400' : ''}`}
            >
              {pitchName(pc)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs" data-help="keyboard">
          {!midi.supported ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Icon name="piano" className="size-4" /> Web MIDI not supported in this browser.
            </span>
          ) : midi.connected ? (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
              <Icon name="piano" className="size-4" /> MIDI connected: {midi.deviceName ?? 'device'}{' '}
              — hold a chord to identify it.
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Icon name="piano" className="size-4" /> MIDI ready — connect a keyboard and hold a
              chord.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">
            {sorted.length ? sorted.map((pc) => pitchName(pc)).join(' · ') : 'No notes selected'}
          </h2>
          {sorted.length ? (
            <>
              <button
                type="button"
                onClick={playSelection}
                className="inline-flex items-center gap-1 text-sm underline"
              >
                <Icon name="play" className="size-4" />
                Play
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-sm text-muted-foreground underline"
              >
                Clear
              </button>
            </>
          ) : null}
        </div>

        {effective.size < 3 ? (
          <p className="text-sm text-muted-foreground">
            Pick at least three notes to name a chord.
          </p>
        ) : matches.length ? (
          <div className="flex flex-wrap gap-2">
            {matches.map((match) => (
              <span
                key={match}
                className="rounded-full border border-blue-500 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100"
              >
                {match}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No standard chord matches — try another combination.
          </p>
        )}
      </div>
    </div>
  );
}
