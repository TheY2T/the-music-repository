import { getAnalyser, getAudioContext, playTone } from '@TheY2T/tmr-music-core/audio';
import { Button, Card } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Live view of the shared master audio bus: the AudioContext state and an oscilloscope reading the
 * master-bus analyser (the same tap the Pixi visualizers use). Play a tone to wake the context and see
 * the waveform move.
 */
export default function AudioInspector() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState('suspended');

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const ctx = getAudioContext();
      if (ctx) setState(ctx.state);
      const analyser = getAnalyser();
      const canvas = canvasRef.current;
      const c2d = canvas?.getContext('2d');
      if (analyser && canvas && c2d) {
        const buf = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buf);
        c2d.clearRect(0, 0, canvas.width, canvas.height);
        c2d.lineWidth = 2;
        // The canvas can't read CSS custom properties; take the resolved colour from `text-primary`.
        c2d.strokeStyle = getComputedStyle(canvas).color;
        c2d.beginPath();
        const slice = canvas.width / buf.length;
        for (let i = 0; i < buf.length; i++) {
          const y = ((buf[i] ?? 128) / 255) * canvas.height;
          const x = i * slice;
          if (i === 0) c2d.moveTo(x, y);
          else c2d.lineTo(x, y);
        }
        c2d.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <p className="font-medium">Master audio bus</p>
          <p className="text-muted-foreground">
            context: <span className="font-mono">{state}</span> · analyser:{' '}
            <span className="font-mono">{getAnalyser() ? 'active' : 'idle'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => playTone(440, 0.6)}>
            Play A4
          </Button>
          <Button size="sm" variant="outline" onClick={() => playTone(261.6, 0.6)}>
            Play C4
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={120}
        className="w-full rounded-md border border-border bg-card text-primary"
      />
    </Card>
  );
}
