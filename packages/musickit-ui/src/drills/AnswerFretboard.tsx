import {
  FRET_MARKERS,
  pitchName,
  STANDARD_TUNING,
  STANDARD_TUNING_NAMES,
} from '@TheY2T/tmr-music-core/music-theory';
import { playNote } from '@TheY2T/tmr-music-core/soundfont';
import { useMidiInput } from '@TheY2T/tmr-music-core/use-midi-input';
import { cn } from '@TheY2T/tmr-ui';
import { useState } from 'react';

const FRETS = 12; // frets 0 (open) → 12

/**
 * A compact guitar-neck capture surface for play-instrument drills. Tap a fret (or play a MIDI note)
 * to sound it and report its MIDI number; the caller lets the learner explore, then submits. After
 * answering, every fret of the correct pitch class lights green and a wrong chosen fret red. Tracks the
 * chosen position internally (a pitch class appears at several frets) — remount via `key` to reset.
 */
export default function AnswerFretboard({
  onNote,
  correctPc = null,
  answered = false,
  disabled = false,
}: {
  onNote: (midi: number) => void;
  correctPc?: number | null;
  answered?: boolean;
  disabled?: boolean;
}) {
  const [selectedPos, setSelectedPos] = useState<string | null>(null);

  function press(midi: number, posKey: string) {
    if (disabled) {
      return;
    }
    try {
      playNote(midi, 0.8);
    } catch {
      // Audio is best-effort — never block the answer.
    }
    setSelectedPos(posKey);
    onNote(midi);
  }

  useMidiInput((midi, isOn) => {
    if (isOn && !disabled) {
      // A MIDI note has no fret position — record it against a synthetic key so Submit still works.
      setSelectedPos(`midi:${midi}`);
      onNote(midi);
    }
  });

  function tone(midi: number, posKey: string): 'success' | 'wrong' | 'selected' | null {
    if (answered && correctPc != null && midi % 12 === correctPc) {
      return 'success';
    }
    if (answered && selectedPos === posKey) {
      return 'wrong';
    }
    if (!answered && selectedPos === posKey) {
      return 'selected';
    }
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-lg overflow-x-auto">
      <table className="w-full border-collapse text-center text-[10px]">
        <thead>
          <tr>
            <th className="w-5" />
            {Array.from({ length: FRETS + 1 }, (_, f) => (
              <th key={f} className="px-0.5 font-normal text-muted-foreground">
                {f === 0 ? '' : f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STANDARD_TUNING.map((open, s) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: string index is the stable row identity
            <tr key={s}>
              <td className="pr-1 text-right text-muted-foreground">{STANDARD_TUNING_NAMES[s]}</td>
              {Array.from({ length: FRETS + 1 }, (_, f) => {
                const midi = open + f;
                const posKey = `${s}:${f}`;
                const t = tone(midi, posKey);
                return (
                  <td
                    key={f}
                    className={cn('border border-border/60', FRET_MARKERS.has(f) && 'bg-muted/40')}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`String ${s + 1} (${STANDARD_TUNING_NAMES[s]}), fret ${f} — ${pitchName(midi % 12)}`}
                      aria-pressed={selectedPos === posKey}
                      onPointerDown={() => press(midi, posKey)}
                      className={cn(
                        'h-7 w-full rounded-sm transition-colors hover:bg-accent/15 disabled:cursor-not-allowed',
                        t === 'selected' && 'bg-accent/30 font-semibold text-accent',
                        t === 'success' && 'bg-success/30 font-semibold text-success',
                        t === 'wrong' && 'bg-destructive/30 font-semibold text-destructive',
                      )}
                    >
                      {t ? pitchName(midi % 12) : ''}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
