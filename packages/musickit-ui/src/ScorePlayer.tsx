import { type Locale, t } from '@TheY2T/tmr-i18n';
import { getInstrumentFor, setInstrumentPref } from '@TheY2T/tmr-music-core/instrument-choice';
import { AlphaTabScoreEngine } from '@TheY2T/tmr-music-core/score/alphatab-engine';
import { orderTicks } from '@TheY2T/tmr-music-core/score/loop-selection';
import type { ScoreDisplayMode, ScoreEngine } from '@TheY2T/tmr-music-core/score/score-engine';
import { useAlphaTabTheme } from '@TheY2T/tmr-music-core/score/use-alphatab-theme';
import { SOUNDFONT_INSTRUMENTS } from '@TheY2T/tmr-music-core/soundfont';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Icon,
  Select,
} from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Sentinel picker value for "play alphaTab's built-in synth instead of a sampled instrument". */
const BUILT_IN_SYNTH = 'synth';

/**
 * Interactive score player shell (ADR 0027). alphaTab is the single engine — it renders + plays both
 * modes; this shell owns ALL interaction (click-to-hear / click-to-seek, drag-select passage, A–B loop,
 * right-click loop menu) uniformly for piano (`mode: 'standard'`, standard notation) AND guitar
 * (`mode: 'tab'`, notation + tab), so their transport + controls stay in sync — only the engraving
 * differs. alphaTab's own selection UI is disabled (`enableUserInteraction: false`). Basic play/tempo
 * when `interactive` is off (the `learning.interactive-scores` flag). Notation strings match the other
 * score tools (en).
 */
export interface ScoreCredit {
  license?: string;
  attribution?: string;
  sourceUrl?: string;
  title?: string;
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function ScorePlayer({
  url,
  tex,
  locale,
  credit,
  mode = 'standard',
  interactive = true,
  tuning,
}: {
  /** URL to fetch the score source from (catalogue). Ignored when `tex` is given. */
  url?: string;
  /** Inline score source (alphaTex, or raw MusicXML/GuitarPro text) — for the tool playgrounds. */
  tex?: string;
  locale: Locale;
  credit?: ScoreCredit;
  mode?: ScoreDisplayMode;
  interactive?: boolean;
  /** `tab` mode only: open-string MIDI pitches to render a pitched score as tablature. */
  tuning?: number[] | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ScoreEngine | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [baseBpm, setBaseBpm] = useState(120);
  const [tempoFactor, setTempoFactor] = useState(1);
  const [metronome, setMetronome] = useState(false);
  const [countIn, setCountIn] = useState(false);
  const [barCount, setBarCount] = useState(0);
  // Which instrument voices the score: a sampled instrument (default, matched to the piece + remembered
  // per family) or alphaTab's built-in synth. Piano scores default to a piano sound, guitar to a guitar.
  const instrumentFamily = mode === 'tab' ? 'guitar' : 'piano';
  const [scoreInstrument, setScoreInstrument] = useState<string>(() =>
    getInstrumentFor(instrumentFamily),
  );
  // A loop = a beat range the user drags across the score (ticks drive the precise loop; bars are just
  // for the readout). `looping` = whether it's currently repeating.
  const [selection, setSelection] = useState<{
    startTick: number;
    endTick: number;
    startBar: number;
    endBar: number;
  } | null>(null);
  const [looping, setLooping] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Mirror the selection into a ref so the (once-registered) onEnded callback can re-cue the passage.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  // Drag state read synchronously inside the mouse handlers (no re-render per mousemove).
  const dragRef = useRef<{
    startTick: number;
    startBar: number;
    moved: boolean;
    range: { startTick: number; endTick: number } | null;
  } | null>(null);
  const lastRangeRef = useRef('');

  // Notation colors follow the active theme. Read once for the initial load (ref, so a theme change
  // doesn't re-run the load effect) and re-apply live via applyResources below.
  const { resources, key: themeKey } = useAlphaTabTheme();
  const resourcesRef = useRef(resources);
  resourcesRef.current = resources;

  // The shell owns interaction (click-to-hear/seek, drag-select, loop, right-click menu) for BOTH piano
  // and guitar so their controls stay in sync — the flag is the only gate.
  const interactiveUI = interactive;
  // Right-click context-menu anchor (viewport coords), or null when closed.
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  // 1) Resolve the score source into state. For a URL this fetches; for inline `tex` it's a passthrough.
  // Keeping the fetch OUT of the engine-load effect means that effect stays SYNCHRONOUS — with an async
  // fetch inside it, the container node can change during the await and alphaTab renders into a detached
  // node (blank score on catalogue pages that re-render as their data hooks resolve).
  const [source, setSource] = useState<string | null>(tex ?? null);
  useEffect(() => {
    if (tex != null) {
      setSource(tex);
      return;
    }
    let cancelled = false;
    setSource(null);
    fetch(url ?? '')
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setSource(t);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [url, tex]);

  // 2) Create + load the engine SYNCHRONOUSLY once the source is ready. alphaTab is heavy (dynamic-import
  // + worker) so this still resolves asynchronously, but the container is captured with no await before
  // `load`, so it can't go stale. A timeout surfaces a wedged worker as an error, not an infinite spinner.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || source == null) return;
    let cancelled = false;
    setStatus('loading');
    setPlayerReady(false);
    setSelection(null);
    setLooping(false);

    const engine = new AlphaTabScoreEngine();
    engineRef.current = engine;
    engine.onPosition((ms, dur) => {
      setPositionMs(ms);
      setDurationMs(dur);
    });
    engine.onState((p) => setPlaying(p));
    engine.onEnded(() => {
      setPlaying(false);
      // Playing a bounded selection stops at its end; re-cue the cursor to its start so the next
      // Play repeats the passage from the beginning.
      const sel = selectionRef.current;
      if (sel) engine.seekTick(sel.startTick);
    });
    engine.onReady(() => {
      if (!cancelled) setPlayerReady(true);
    });
    const timeout = setTimeout(() => {
      if (!cancelled) setStatus('error');
    }, 15000);
    engine
      .load(container, source, {
        mode,
        resources: resourcesRef.current,
        tuning,
      })
      .then((result) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setDurationMs(result.durationMs);
        setBaseBpm(result.baseBpm);
        setBarCount(result.barCount);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      engine.destroy();
      engineRef.current = null;
    };
  }, [source, mode]);

  // Push control changes into the engine.
  useEffect(() => engineRef.current?.setTempoFactor(tempoFactor), [tempoFactor]);
  useEffect(() => engineRef.current?.setMetronome(metronome), [metronome]);
  useEffect(() => engineRef.current?.setCountIn(countIn), [countIn]);
  // Route playback through the chosen sampled instrument (or back to the built-in synth). Re-applied
  // whenever the player becomes ready (a fresh engine after a source/mode change starts on the synth).
  useEffect(() => {
    if (!playerReady) return;
    engineRef.current?.setSampledInstrument(
      scoreInstrument === BUILT_IN_SYNTH ? null : scoreInstrument,
    );
  }, [scoreInstrument, playerReady]);

  const changeInstrument = useCallback(
    (name: string) => {
      setScoreInstrument(name);
      if (name !== BUILT_IN_SYNTH) setInstrumentPref(instrumentFamily, name);
    },
    [instrumentFamily],
  );
  // Re-theme notation glyphs when the aesthetic / dark-mode changes. The current resources are ALREADY
  // applied at load, so skip the first application once ready — calling api.render() again mid-way through
  // the initial paint clobbers it (leaves the score blank on heavier pages). Only re-apply on a genuine
  // later theme switch.
  const themeAppliedRef = useRef(false);
  useEffect(() => {
    if (status !== 'ready') return;
    if (!themeAppliedRef.current) {
      themeAppliedRef.current = true;
      return;
    }
    engineRef.current?.applyResources(resources);
  }, [themeKey, status, resources]);
  useEffect(() => {
    themeAppliedRef.current = false;
  }, [source, mode]);

  const togglePlay = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !playerReady) return;
    if (playing) engine.pause();
    else engine.play();
  }, [playing, playerReady]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const toStart = useCallback(() => engineRef.current?.seekMs(0), []);

  // Clear the selected passage → back to playing the whole piece.
  const clearSelection = useCallback(() => {
    engineRef.current?.clearRange();
    setLooping(false);
    setSelection(null);
  }, []);

  // Toggle repeat. With a selected passage, repeat that passage (its range is already bounded);
  // with nothing selected, loop the whole piece.
  const toggleLoop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !playerReady) return;
    const next = !looping;
    if (selection) engine.setLooping(next);
    else if (next) engine.loopWhole();
    else engine.clearRange();
    setLooping(next);
  }, [looping, selection, playerReady]);

  // Play the selected passage from its start (used by the context menu).
  const playSelection = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !playerReady || !selection) return;
    engine.seekTick(selection.startTick);
    engine.play();
  }, [playerReady, selection]);

  // Right-click anywhere on the score → contextual loop menu (works in both modes).
  const onContextMenu = useCallback(
    (ev: React.MouseEvent) => {
      if (!interactiveUI || status !== 'ready') return;
      ev.preventDefault();
      setMenuPos({ x: ev.clientX, y: ev.clientY });
    },
    [interactiveUI, status],
  );

  // Interaction (both modes): press on a note to hear it; drag across the score to select a beat range
  // (live-highlighted, beat-precise — can start/end mid-bar); a press with no drag is a click → seek.
  const onPointerDown = useCallback(
    (ev: React.MouseEvent) => {
      const engine = engineRef.current;
      if (!engine || status !== 'ready' || !interactiveUI || ev.button !== 0) return;
      const hit = engine.hitTest(ev.clientX, ev.clientY);
      if (!hit || hit.tick == null) return;
      // A fresh interaction drops any prior selection/loop before building the next one.
      engine.clearRange();
      setSelection(null);
      setLooping(false);
      dragRef.current = { startTick: hit.tick, startBar: hit.bar ?? 0, moved: false, range: null };
      lastRangeRef.current = '';
      setDragging(true);
      if (hit.midi != null) engine.playNote(hit.midi);
    },
    [status, interactiveUI],
  );

  const onPointerMove = useCallback((ev: React.MouseEvent) => {
    const engine = engineRef.current;
    const d = dragRef.current;
    if (!engine || !d) return;
    const hit = engine.hitTest(ev.clientX, ev.clientY);
    if (hit?.tick == null) return;
    if (hit.tick === d.startTick && !d.moved) return; // no drag yet — still a potential click
    const range = orderTicks(d.startTick, hit.tick);
    const key = `${range.startTick}:${range.endTick}`;
    if (key === lastRangeRef.current) return;
    lastRangeRef.current = key;
    d.moved = true;
    d.range = range;
    const startBar = Math.min(d.startBar, hit.bar ?? d.startBar);
    const endBar = Math.max(d.startBar, hit.bar ?? d.startBar);
    setSelection({ ...range, startBar, endBar });
    engine.highlightRange(range);
  }, []);

  const onPointerUp = useCallback(() => {
    const engine = engineRef.current;
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!engine || !d) return;
    if (d.moved && d.range) {
      // Bound playback to the dragged passage + cue the cursor at its start; Play now plays this
      // passage and (since we don't loop by default) stops at its end.
      engine.applyRange(d.range);
    } else {
      // A plain click: no selection — just seek to the clicked beat.
      engine.highlightRange(null);
      engine.seekTick(d.startTick);
    }
  }, []);

  if (status === 'error') {
    return <p className="text-sm text-destructive">{t(locale, 'score.error')}</p>;
  }

  const bpm = Math.round(baseBpm * tempoFactor);
  const showTransport = interactive; // full transport chrome (loop is piano-only, gated again below)
  const barsLabel = (kind: 'loop' | 'selected', sel: { startBar: number; endBar: number }) => {
    const single = sel.startBar === sel.endBar;
    const prefix = t(locale, `score.${kind}${single ? 'Bar' : 'Bars'}` as 'score.loopBar');
    const range = single ? `${sel.startBar + 1}` : `${sel.startBar + 1}–${sel.endBar + 1}`;
    return `${prefix} ${range}${barCount ? ` / ${barCount}` : ''}`;
  };
  const loopReadout = looping
    ? selection
      ? barsLabel('loop', selection)
      : t(locale, 'score.loopAll')
    : selection
      ? barsLabel('selected', selection)
      : null;

  return (
    <div className="space-y-3">
      {/* alphaTab paints its playback cursor + A–B selection as DOM overlays inside the container —
          theme them with token vars (scoped to this player so nothing leaks). */}
      <style>{`
        .tmr-score .at-cursor-bar { background: var(--primary); opacity: 0.07; }
        .tmr-score .at-cursor-beat { background: var(--primary); width: 2px; }
        .tmr-score .at-selection div { background: var(--primary); opacity: 0.18; }
        .tmr-score[data-looping='true'] .at-selection div { background: var(--accent); opacity: 0.32; }
      `}</style>

      {/* Integrated media-player control bar. */}
      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-2">
        {/* Transport + progress */}
        <div className="flex items-center gap-1.5">
          {showTransport ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toStart}
              disabled={!playerReady}
              aria-label={t(locale, 'score.toStart')}
              title={t(locale, 'score.toStart')}
            >
              <Icon name="skip-back" className="size-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            onClick={togglePlay}
            disabled={!playerReady}
            aria-label={t(locale, playing ? 'score.pause' : 'score.play')}
            title={t(locale, playing ? 'score.pause' : 'score.play')}
          >
            <Icon
              name={playing ? 'pause' : 'play'}
              className={cn('size-4', playing && 'fill-current')}
            />
          </Button>
          {showTransport ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={stop}
              disabled={!playerReady}
              aria-label={t(locale, 'score.stop')}
              title={t(locale, 'score.stop')}
            >
              <Icon name="square" className="size-3 fill-current" />
            </Button>
          ) : null}
          {showTransport ? (
            <>
              <span className="ml-1 w-10 text-right font-mono text-xs text-muted-foreground tabular-nums">
                {fmt(positionMs)}
              </span>
              <input
                type="range"
                className="flex-1"
                min={0}
                max={Math.max(1, durationMs)}
                step={10}
                value={Math.min(positionMs, durationMs)}
                onChange={(e) => engineRef.current?.seekMs(Number(e.target.value))}
                aria-label={t(locale, 'score.scrub')}
                disabled={!playerReady}
              />
              <span className="w-10 font-mono text-xs text-muted-foreground tabular-nums">
                {fmt(durationMs)}
              </span>
            </>
          ) : null}
        </div>

        {/* Options: tempo · loop-a-section · metronome · count-in · print */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t(locale, 'score.tempo')}</span>
            <input
              type="range"
              min={0.25}
              max={1.5}
              step={0.05}
              value={tempoFactor}
              onChange={(e) => setTempoFactor(Number(e.target.value))}
              className="w-24"
              aria-label={t(locale, 'score.tempo')}
            />
            <span className="w-16 tabular-nums text-xs text-muted-foreground">{bpm} BPM</span>
          </label>

          {showTransport ? (
            <>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={metronome}
                  onChange={(e) => setMetronome(e.target.checked)}
                />
                {t(locale, 'score.metronome')}
              </label>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={countIn}
                  onChange={(e) => setCountIn(e.target.checked)}
                />
                {t(locale, 'score.countIn')}
              </label>
            </>
          ) : null}

          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t(locale, 'score.instrument')}</span>
            <Select
              value={scoreInstrument}
              onChange={(e) => changeInstrument(e.target.value)}
              className="h-auto w-auto px-2 py-1"
              aria-label={t(locale, 'score.instrument')}
            >
              <option value={BUILT_IN_SYNTH}>{t(locale, 'score.builtInSynth')}</option>
              {SOUNDFONT_INSTRUMENTS.map((inst) => (
                <option key={inst.name} value={inst.name}>
                  {inst.label}
                </option>
              ))}
            </Select>
          </label>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => engineRef.current?.print()}
            disabled={status !== 'ready'}
          >
            <Icon name="download" className="size-4" />
            {t(locale, 'score.downloadPdf')}
          </Button>
        </div>

        {/* Active-loop / selection readout, else the drag-to-select hint. */}
        {loopReadout ? (
          <p className="flex items-center gap-1.5 text-xs text-primary">
            <Icon name="repeat" className="size-3.5" />
            {loopReadout}
          </p>
        ) : interactiveUI ? (
          <p className="text-xs text-muted-foreground">{t(locale, 'score.loopHint')}</p>
        ) : null}
      </div>

      {status === 'loading' ? (
        <p className="text-sm text-muted-foreground">{t(locale, 'score.loading')}</p>
      ) : null}

      {/* Score surface (whole piece, scrollable). alphaTab renders + scrolls the cursor here. Press +
          drag across bars to select a loop section (live-highlighted); a plain click seeks/hears;
          right-click opens the contextual loop menu. */}
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-card">
        {/* biome-ignore lint/a11y/noStaticElementInteractions: graphical score surface; keyboard users use the transport controls + scrub. */}
        <div
          ref={containerRef}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onContextMenu={onContextMenu}
          data-mode={mode}
          data-looping={looping && selection ? 'true' : undefined}
          className={cn(
            'tmr-score select-none p-2',
            interactiveUI && status === 'ready' && 'cursor-crosshair',
            dragging && 'ring-2 ring-inset ring-primary/50',
          )}
        />
      </div>

      {/* Right-click contextual loop menu (both modes). A fixed 0×0 anchor is positioned at the
          click point; the design-system DropdownMenu pops from it. */}
      {interactiveUI ? (
        <DropdownMenu
          open={menuPos != null}
          onOpenChange={(open) => {
            if (!open) setMenuPos(null);
          }}
          style={
            // z-index must clear alphaTab's own cursor/selection overlay (`.at-cursors`, z-index 1000),
            // which otherwise paints over the menu and makes its opaque background look translucent.
            menuPos
              ? { position: 'fixed', left: menuPos.x, top: menuPos.y, zIndex: 2000 }
              : undefined
          }
        >
          <DropdownMenuContent align="start" className="z-[2000] min-w-44">
            {selection ? (
              <>
                <DropdownMenuItem onSelect={playSelection} disabled={!playerReady}>
                  <Icon name="play" className="size-4" />
                  {t(locale, 'score.playSelection')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleLoop} disabled={!playerReady}>
                  <Icon name="repeat" className="size-4" />
                  {t(locale, looping ? 'score.stopLooping' : 'score.loopSelection')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={clearSelection} disabled={!playerReady}>
                  {t(locale, 'score.loopClear')}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={toggleLoop} disabled={!playerReady}>
                <Icon name="repeat" className="size-4" />
                {t(locale, looping ? 'score.stopLooping' : 'score.loopWholePiece')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {credit && (credit.attribution || credit.license) ? (
        <p className="text-xs text-muted-foreground">
          {t(locale, 'score.creditLabel')}{' '}
          {credit.sourceUrl ? (
            <a
              href={credit.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {credit.attribution}
            </a>
          ) : (
            credit.attribution
          )}
          {credit.attribution && credit.license ? ' · ' : ''}
          {credit.license}
        </p>
      ) : null}
    </div>
  );
}
