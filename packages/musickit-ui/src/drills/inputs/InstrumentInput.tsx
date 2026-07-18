import { type MessageKey, t } from '@TheY2T/tmr-i18n';
import { playNotes } from '@TheY2T/tmr-music-core/drills/audio-prompt';
import { Button, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import AnswerFretboard from '../AnswerFretboard';
import AnswerKeyboard from '../AnswerKeyboard';
import type { DrillInputProps } from './types';

/**
 * Play-instrument answer input: hear the prompt, explore freely on the capture surface (keyboard or
 * fretboard — every key/fret sounds), then press Submit to commit. The drill checks the pitch class;
 * exploring doesn't lock the answer, so you can hunt for the pitch before committing.
 */
export default function InstrumentInput({ item, answered, onAnswer, locale }: DrillInputProps) {
  const notes = item.presentation.kind === 'audio' ? item.presentation.notes : [];
  const [selected, setSelected] = useState<number | null>(null);

  // Auto-play the prompt + reset the choice on each new card.
  useEffect(() => {
    setSelected(null);
    playNotes(notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.card]);

  const instruction = item.instruction
    ? t(locale, item.instruction.key as MessageKey, item.instruction.params)
    : t(locale, 'drill.playWhatYouHear');
  const locked = answered != null;
  const correctPc = locked ? Number(item.expected) : null;
  const capture = (midi: number) => {
    if (!locked) {
      setSelected(midi);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">{instruction}</p>
      {notes.length > 0 ? (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" onClick={() => playNotes(notes)} disabled={locked}>
            <Icon name="play" className="size-4" />
            {t(locale, 'drill.replay')}
          </Button>
        </div>
      ) : null}

      {item.instrument === 'fretboard' ? (
        <AnswerFretboard
          key={item.card}
          onNote={capture}
          correctPc={correctPc}
          answered={locked}
          disabled={locked}
        />
      ) : (
        <AnswerKeyboard
          onNote={capture}
          selectedMidi={selected}
          correctPc={correctPc}
          answered={locked}
          disabled={locked}
        />
      )}

      {!locked ? (
        <div className="text-center">
          <Button
            disabled={selected == null}
            onClick={() => selected != null && onAnswer(String(selected % 12))}
          >
            {t(locale, 'drill.submit')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
