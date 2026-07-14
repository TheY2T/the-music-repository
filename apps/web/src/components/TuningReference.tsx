import { Button, Icon } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PixiCanvas } from '@/components/PixiCanvas';
import { playTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';
import { detectPitchHz, hzToNote } from '@/lib/pitch-detection';

const CONCERT_A = { label: 'A', octave: 4, midi: 69 };

/** Standard guitar tuning, thickest string (6) to thinnest (1). */
const GUITAR_STRINGS = [
  { string: 6, note: 'E', midi: 40 },
  { string: 5, note: 'A', midi: 45 },
  { string: 4, note: 'D', midi: 50 },
  { string: 3, note: 'G', midi: 55 },
  { string: 2, note: 'B', midi: 59 },
  { string: 1, note: 'E', midi: 64 },
];

function ReferenceButton({ midi, label }: { midi: number; label: string }) {
  const hz = Math.round(midiToFrequency(midi) * 10) / 10;
  return (
    <button
      type="button"
      onClick={() => playTone(midiToFrequency(midi), 1.8)}
      className="flex flex-col items-center rounded-lg border border-border px-5 py-3 hover:bg-muted"
    >
      <span className="text-xl font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{hz} Hz</span>
    </button>
  );
}

type MicState = 'idle' | 'listening' | 'denied' | 'unsupported';

export default function TuningReference() {
  const [mic, setMic] = useState<MicState>('idle');
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdate = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setNote(null);
    setCents(0);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMic('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctor =
        window.AudioContext ??
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      // Mic → analyser only (never to destination — that would feed back).
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      setMic('listening');

      const tick = () => {
        analyser.getFloatTimeDomainData(buffer);
        const hz = detectPitchHz(buffer, ctx.sampleRate);
        const now = performance.now();
        if (now - lastUpdate.current > 60) {
          lastUpdate.current = now;
          if (hz) {
            const detected = hzToNote(hz);
            setNote(`${detected.name}${detected.octave}`);
            setCents(detected.cents);
          } else {
            setNote(null);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setMic('denied');
    }
  }, []);

  // Stop the mic + loop on unmount.
  useEffect(() => stop, [stop]);

  const listening = mic === 'listening';
  const toggle = () => {
    if (listening) {
      stop();
      setMic('idle');
    } else {
      void start();
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3" data-help="tuner">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium">Chromatic tuner</h2>
          <Button type="button" variant={listening ? 'outline' : 'default'} onClick={toggle}>
            <Icon name={listening ? 'square' : 'mic'} className="size-4" />
            {listening ? 'Stop' : 'Start listening'}
          </Button>
        </div>

        <PixiCanvas
          ariaLabel="Tuner meter showing pitch accuracy in cents"
          loader={() => import('@/lib/pixi/tuner-scene')}
          sceneProps={{ note, cents, active: listening }}
          className="mx-auto w-full max-w-sm"
          containerClassName="aspect-[2/1] w-full rounded-lg border border-border bg-muted/40"
          fallback={
            <div className="mx-auto flex aspect-[2/1] w-full max-w-sm flex-col items-center justify-center rounded-lg border border-border bg-muted/40">
              <span className="text-4xl font-bold">{listening ? (note ?? '—') : '—'}</span>
              <span className="font-mono text-sm text-muted-foreground">
                {listening && note ? `${cents > 0 ? '+' : ''}${cents}¢` : ''}
              </span>
            </div>
          }
        />

        <p className="text-xs text-muted-foreground">
          {mic === 'denied'
            ? 'Microphone access was denied — allow it in your browser to use the tuner.'
            : mic === 'unsupported'
              ? 'Microphone input is not available in this browser; use the reference tones below.'
              : 'Play a note near your microphone; match the needle to the centre (green) to be in tune.'}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Concert pitch</h2>
        <ReferenceButton midi={CONCERT_A.midi} label={`${CONCERT_A.label}${CONCERT_A.octave}`} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Guitar — standard tuning</h2>
        <div className="flex flex-wrap gap-3">
          {GUITAR_STRINGS.map((s) => (
            <ReferenceButton key={s.string} midi={s.midi} label={`${s.string} · ${s.note}`} />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Tap a note to hear a steady reference tone, then tune your string to match it by ear.
      </p>
    </div>
  );
}
