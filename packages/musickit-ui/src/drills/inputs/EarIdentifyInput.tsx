import { t } from '@TheY2T/tmr-i18n';
import { playNotes } from '@TheY2T/tmr-music-core/drills/audio-prompt';
import { Button, Icon } from '@TheY2T/tmr-ui';
import { useEffect } from 'react';
import OptionGrid from './OptionGrid';
import type { DrillInputProps } from './types';

/** Ear-identify answer input: a replayable audio prompt plus a locking option grid. */
export default function EarIdentifyInput({ item, answered, onAnswer, locale }: DrillInputProps) {
  const notes = item.presentation.kind === 'audio' ? item.presentation.notes : [];

  // Auto-play once per card (silent until the first user gesture resumes the AudioContext).
  useEffect(() => {
    playNotes(notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.card]);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Button variant="outline" size="lg" onClick={() => playNotes(notes)}>
          <Icon name="play" className="size-4" />
          {t(locale, 'drill.replay')}
        </Button>
      </div>
      <OptionGrid
        options={item.options ?? []}
        expected={item.expected}
        answered={answered}
        onAnswer={onAnswer}
      />
    </div>
  );
}
