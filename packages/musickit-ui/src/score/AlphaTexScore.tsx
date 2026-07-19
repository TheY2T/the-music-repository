import { type Locale, t } from '@TheY2T/tmr-i18n';
import { AlphaTabScoreEngine } from '@TheY2T/tmr-music-core/score/alphatab-engine';
import type { ScoreDisplayMode } from '@TheY2T/tmr-music-core/score/score-engine';
import { useAlphaTabTheme } from '@TheY2T/tmr-music-core/score/use-alphatab-theme';
import { Button, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight alphaTab notation surface (ADR 0027) that the interactive tools use to render generated
 * notation. Renders an alphaTex string with alphaTab; when `tex` changes it
 * **reloads into the same engine** (`engine.reload`) so the Worker/synth stay warm across exercise
 * regenerations. Optional inline Play/Pause (alphaTab's synth). Notation strings are English to match
 * the other score tools. Deliberately simpler than `ScorePlayer` (no scrub/loop/metronome chrome).
 */
export default function AlphaTexScore({
  tex,
  mode = 'standard',
  tuning,
  locale,
  showPlay = true,
  className,
}: {
  tex: string;
  mode?: ScoreDisplayMode;
  tuning?: number[] | null;
  locale: Locale;
  showPlay?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<AlphaTabScoreEngine | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { resources, key: themeKey } = useAlphaTabTheme();
  const resourcesRef = useRef(resources);
  resourcesRef.current = resources;
  // The tex loaded at mount; a change to it after mount triggers a reload (not a remount).
  const initialTexRef = useRef(tex);

  // Create the engine once and load the initial score.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    const engine = new AlphaTabScoreEngine();
    engineRef.current = engine;
    engine.onState((p) => setPlaying(p));
    engine.onEnded(() => setPlaying(false));
    engine.onReady(() => {
      if (!cancelled) setPlayerReady(true);
    });
    engine
      .load(container, initialTexRef.current, {
        mode,
        resources: resourcesRef.current,
        tuning,
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [mode, tuning]);

  // Swap the score in place when `tex` changes (skip the initial value — the mount effect loaded it).
  useEffect(() => {
    if (tex !== initialTexRef.current) engineRef.current?.reload(tex);
  }, [tex]);

  // Re-theme notation on aesthetic / dark-mode switch.
  useEffect(() => {
    if (playerReady) engineRef.current?.applyResources(resources);
  }, [themeKey, playerReady, resources]);

  return (
    <div className={className}>
      <style>{`
        .tmr-score .at-cursor-bar { background: var(--primary); opacity: 0.07; }
        .tmr-score .at-cursor-beat { background: var(--primary); width: 2px; }
      `}</style>
      {showPlay ? (
        <Button
          type="button"
          size="sm"
          onClick={() => (playing ? engineRef.current?.pause() : engineRef.current?.play())}
          disabled={!playerReady}
          className="mb-2"
        >
          <Icon name={playing ? 'pause' : 'play'} className="size-4" />
          {t(locale, playing ? 'score.pause' : 'score.play')}
        </Button>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div ref={containerRef} className="tmr-score p-2" />
      </div>
    </div>
  );
}
