/**
 * PixiJS audio-reactive visualizer — a spectrum + waveform driven by the master-bus `AnalyserNode`
 * (`getAnalyser()` in `@/lib/audio`), so it reacts to everything the app plays through the shared
 * audio engine (metronome, backing track, tones). Purely decorative; colours re-tint with the theme.
 *
 * Loaded lazily by {@link PixiCanvas}; never imported on the server. See
 * docs/features/pixi-visualization.md and ADR 0022.
 */
import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixiSceneBaseProps } from '@/components/PixiCanvas';
import { getAnalyser } from '@/lib/audio';
import { useThemeColors } from './use-theme-colors';

extend({ Container, Graphics });

const MAX_BARS = 72;
const noDraw = () => {};

function Visualizer({ reducedMotion }: { reducedMotion: boolean }) {
  const { app, isInitialised } = useApplication();
  const colors = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const graphics = useRef<Graphics | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const freq = useRef(new Uint8Array(0));
  const wave = useRef(new Uint8Array(0));

  // Grab the shared analyser once (this also lazily builds the master bus).
  useEffect(() => {
    const a = getAnalyser();
    analyser.current = a;
    if (a) {
      freq.current = new Uint8Array(a.frequencyBinCount);
      wave.current = new Uint8Array(a.fftSize);
    }
  }, []);

  useEffect(() => {
    if (!isInitialised || !app?.canvas) {
      return;
    }
    const read = () => setSize({ w: app.screen.width, h: app.screen.height });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(app.canvas);
    return () => observer.disconnect();
  }, [isInitialised, app]);

  useTick(
    useCallback(() => {
      const g = graphics.current;
      const a = analyser.current;
      if (!g || size.w === 0) {
        return;
      }
      g.clear();
      // No analyser or reduced motion → a calm baseline, no animation.
      if (!a || reducedMotion) {
        g.moveTo(0, size.h / 2)
          .lineTo(size.w, size.h / 2)
          .stroke({ color: colors.border, width: 1 });
        return;
      }
      // Spectrum bars.
      a.getByteFrequencyData(freq.current);
      const bins = Math.min(freq.current.length, MAX_BARS);
      const barW = size.w / bins;
      for (let i = 0; i < bins; i += 1) {
        const v = freq.current[i] / 255;
        const h = v * size.h * 0.92;
        g.rect(i * barW, size.h - h, barW * 0.78, h).fill({
          color: colors.accent,
          alpha: 0.3 + v * 0.5,
        });
      }
      // Waveform overlay (time domain), mid-line centred.
      a.getByteTimeDomainData(wave.current);
      const n = wave.current.length;
      g.moveTo(0, (wave.current[0] / 255) * size.h);
      for (let i = 1; i < n; i += 1) {
        g.lineTo((i / n) * size.w, (wave.current[i] / 255) * size.h);
      }
      g.stroke({ color: colors.primary, width: 1.5, alpha: 0.9 });
    }, [size, colors, reducedMotion]),
  );

  if (!isInitialised || size.w === 0) {
    return null;
  }
  return <pixiGraphics ref={graphics} draw={noDraw} />;
}

export default function AudioVisualizerScene({
  resizeTo,
  reducedMotion,
  resolution,
}: PixiSceneBaseProps) {
  return (
    <Application
      resizeTo={resizeTo}
      backgroundAlpha={0}
      resolution={resolution}
      autoDensity
      antialias
    >
      <Visualizer reducedMotion={reducedMotion} />
    </Application>
  );
}
