import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';

/**
 * Decorative audio-reactive visualizer strip, reusable on any player that routes sound through
 * `@/lib/audio` (metronome, backing track, tones). Renders the WebGL spectrum/waveform when
 * available and a calm static line otherwise. Purely visual — no controls to make accessible.
 * See docs/features/pixi-visualization.md.
 */
export default function AudioVisualizer({ className }: { className?: string }) {
  return (
    <PixiCanvas
      decorative
      loader={() => import('@TheY2T/tmr-music-core/pixi/audio-visualizer-scene')}
      sceneProps={{}}
      containerClassName={className ?? 'h-20 w-full rounded-lg border border-border bg-muted/40'}
      fallback={
        <div
          aria-hidden
          className={className ?? 'h-20 w-full rounded-lg border border-border bg-muted/40'}
        />
      }
    />
  );
}
