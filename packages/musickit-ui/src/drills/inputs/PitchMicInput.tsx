import { type MessageKey, t } from '@TheY2T/tmr-i18n';
import { playNotes } from '@TheY2T/tmr-music-core/drills/audio-prompt';
import { detectedPitchClass, sustainedPitchClass } from '@TheY2T/tmr-music-core/drills/pitch-match';
import { detectPitchHz, hzToNote } from '@TheY2T/tmr-music-core/pitch-detection';
import { Button, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import InstrumentInput from './InstrumentInput';
import type { DrillInputProps } from './types';

// Frames of agreement before a sung note is accepted (≈130ms at 60fps).
const SUSTAIN_FRAMES = 8;

function micAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * Pitch/mic answer input: hear the prompt, then sing (or play) the target — the microphone detects the
 * sustained pitch class and submits it. Falls back to the keyboard (InstrumentInput) when there's no
 * mic or permission is denied, or when the learner opts out — so the drill is always answerable.
 */
export default function PitchMicInput(props: DrillInputProps) {
  const { item, answered, onAnswer, locale } = props;
  const notes = item.presentation.kind === 'audio' ? item.presentation.notes : [];
  const [mode, setMode] = useState<'idle' | 'listening' | 'fallback'>(
    micAvailable() ? 'idle' : 'fallback',
  );
  const [heard, setHeard] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const readings = useRef<(number | null)[]>([]);
  const answeredRef = useRef(false);
  answeredRef.current = answered != null;

  const instruction = item.instruction
    ? t(locale, item.instruction.key as MessageKey, item.instruction.params)
    : t(locale, 'drill.playWhatYouHear');

  function stop() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    readings.current = [];
    setHeard(null);
  }

  // Auto-play the prompt (mic modes only — the fallback's InstrumentInput plays it itself) + release
  // the mic on card change / unmount.
  useEffect(() => {
    if (mode !== 'fallback') {
      playNotes(notes);
    }
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.card]);

  // Release the mic as soon as the answer is committed.
  useEffect(() => {
    if (answered != null) {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered]);

  async function startListening() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      setMode('listening');

      const loop = () => {
        if (answeredRef.current) {
          return;
        }
        analyser.getFloatTimeDomainData(buffer);
        const hz = detectPitchHz(buffer, ctx.sampleRate);
        setHeard(hz != null ? hzToNote(hz).name : null);
        readings.current = [
          ...readings.current.slice(-(SUSTAIN_FRAMES - 1)),
          detectedPitchClass(hz),
        ];
        const held = sustainedPitchClass(readings.current, SUSTAIN_FRAMES);
        if (held != null) {
          stop();
          onAnswer(String(held));
          return;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      stop();
      setMode('fallback');
    }
  }

  if (mode === 'fallback') {
    return <InstrumentInput {...props} />;
  }

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">{instruction}</p>
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => playNotes(notes)} disabled={answered != null}>
          <Icon name="play" className="size-4" />
          {t(locale, 'drill.replay')}
        </Button>
      </div>

      {mode === 'idle' ? (
        <div className="space-y-3 text-center">
          <Button onClick={startListening} disabled={answered != null}>
            <Icon name="mic" className="size-4" />
            {t(locale, 'drill.startSinging')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Icon name="mic" className="size-4 animate-pulse text-accent" />
            {t(locale, 'drill.listening')}
          </p>
          <p className="font-display text-3xl font-semibold tabular-nums">{heard ?? '—'}</p>
        </div>
      )}

      <p className="text-center">
        <button
          type="button"
          onClick={() => {
            stop();
            setMode('fallback');
          }}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          {t(locale, 'drill.useKeyboardInstead')}
        </button>
      </p>
    </div>
  );
}
