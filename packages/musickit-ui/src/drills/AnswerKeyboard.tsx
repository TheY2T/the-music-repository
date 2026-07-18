import { keyLayout } from '@TheY2T/tmr-music-core/keyboard';
import { pitchName } from '@TheY2T/tmr-music-core/music-theory';
import { playNote } from '@TheY2T/tmr-music-core/soundfont';
import { useMidiInput } from '@TheY2T/tmr-music-core/use-midi-input';
import { cn } from '@TheY2T/tmr-ui';

const START_MIDI = 60; // C4
const KEY_COUNT = 13; // C4 → C5 inclusive

/**
 * A compact one-octave capture keyboard for play-instrument drills. Pressing a key (pointer, or a
 * connected MIDI keyboard) sounds the note and reports its MIDI number to `onNote` — the caller lets
 * the learner explore, then submits. After answering, `correctPc` lights every matching key green and a
 * wrong `selectedMidi` red. Not the full `PianoKeyboard` tool: an answer-only surface.
 */
export default function AnswerKeyboard({
  onNote,
  selectedMidi = null,
  correctPc = null,
  answered = false,
  disabled = false,
  showNames = true,
}: {
  onNote: (midi: number) => void;
  /** The note the learner has currently chosen (accent highlight while exploring). */
  selectedMidi?: number | null;
  /** Once answered, the correct pitch class — every key of it is marked success. */
  correctPc?: number | null;
  answered?: boolean;
  disabled?: boolean;
  showNames?: boolean;
}) {
  const layout = keyLayout(START_MIDI, KEY_COUNT);

  function press(midi: number) {
    if (disabled) {
      return;
    }
    try {
      playNote(midi, 0.8);
    } catch {
      // Audio is best-effort (no AudioContext during SSR/tests) — never block the answer.
    }
    onNote(midi);
  }

  useMidiInput((midi, isOn) => {
    if (isOn) {
      press(midi);
    }
  });

  /** Feedback state for a key: success (correct answer), wrong (chosen but wrong), selected (exploring). */
  function keyTone(midi: number): 'success' | 'wrong' | 'selected' | null {
    if (answered && correctPc != null && midi % 12 === correctPc) {
      return 'success';
    }
    if (answered && selectedMidi === midi) {
      return 'wrong';
    }
    if (!answered && selectedMidi === midi) {
      return 'selected';
    }
    return null;
  }

  return (
    <div className="relative mx-auto h-40 w-full max-w-md select-none">
      <div className="flex h-full w-full gap-px">
        {layout.whiteMidis.map((midi) => {
          const tone = keyTone(midi);
          return (
            <button
              key={midi}
              type="button"
              disabled={disabled}
              aria-label={pitchName(midi % 12)}
              aria-pressed={selectedMidi === midi}
              onPointerDown={() => press(midi)}
              className={cn(
                'relative flex-1 rounded-b-md border border-border bg-background transition-colors hover:bg-muted disabled:cursor-not-allowed',
                tone === 'selected' && 'border-accent bg-accent/20',
                tone === 'success' && 'border-success bg-success/25',
                tone === 'wrong' && 'border-destructive bg-destructive/25',
              )}
            >
              {showNames ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[10px] text-muted-foreground">
                  {pitchName(midi % 12)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {layout.blackMidis.map(({ midi, afterWhiteIndex }) => {
        const tone = keyTone(midi);
        return (
          <button
            key={midi}
            type="button"
            disabled={disabled}
            aria-label={pitchName(midi % 12)}
            aria-pressed={selectedMidi === midi}
            onPointerDown={(e) => {
              e.stopPropagation();
              press(midi);
            }}
            style={{
              left: `calc(${(afterWhiteIndex + 1) * layout.whiteWidthPct}% - ${layout.whiteWidthPct / 4}%)`,
              width: `${layout.whiteWidthPct / 2}%`,
            }}
            className={cn(
              'absolute top-0 h-2/3 rounded-b-md border border-foreground bg-foreground transition-colors disabled:cursor-not-allowed',
              tone === 'selected' && 'border-accent bg-accent',
              tone === 'success' && 'border-success bg-success',
              tone === 'wrong' && 'border-destructive bg-destructive',
            )}
          />
        );
      })}
    </div>
  );
}
