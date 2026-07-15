/**
 * alphaTab-backed {@link ScoreEngine} — the SINGLE score engine (ADR 0027). alphaTab renders standard
 * notation (piano grand staff) and tablature (guitar) and owns its own synth (AlphaSynth + SONiVOX
 * soundfont), playback cursor, and A–B loop, so this adapter maps the shell's transport/interaction
 * onto alphaTab's API. Font + soundfont are self-hosted at `/font` + `/soundfont` by the
 * `alphaTab()` Vite plugin (see astro.config.mjs) — no CDN. Click-to-hear reuses the shared sampled
 * note service for a warmer one-shot than the synth. alphaTab is dynamically imported (heavy: renderer
 * + synth worklet) and is E2E-tested only.
 */
import type { AlphaTabApi, model } from '@coderline/alphatab';
import { playNote as sampledPlayNote } from '@/lib/soundfont';
import type {
  LoopSelection,
  ScoreEngine,
  ScoreEngineOptions,
  ScoreHit,
  ScoreLoadResult,
} from './score-engine';
import type { AlphaTabResources } from './use-alphatab-theme';

type AlphaTabModule = typeof import('@coderline/alphatab');

/** alphaTab uses 960 MIDI ticks per quarter note. */
const TICKS_PER_QUARTER = 960;

export class AlphaTabScoreEngine implements ScoreEngine {
  private mod: AlphaTabModule | null = null;
  private api: AlphaTabApi | null = null;
  private container: HTMLElement | null = null;
  private durationMs = 0;
  /** Beat onset tick → Beat, so a beat-precise A–B loop resolves its endpoint ticks back to beats. */
  private beatsByTick = new Map<number, model.Beat>();
  private barCount = 0;
  /** Hides alphaTab's ungated "rendered by alphaTab" footer as SVG partials are appended. */
  private brandingObserver: MutationObserver | null = null;

  private positionCb: ((ms: number, durationMs: number) => void) | null = null;
  private stateCb: ((playing: boolean) => void) | null = null;
  private readyCb: (() => void) | null = null;
  private endedCb: (() => void) | null = null;

  async load(
    container: HTMLElement,
    source: string,
    opts: ScoreEngineOptions,
  ): Promise<ScoreLoadResult> {
    this.container = container;
    const at = await import('@coderline/alphatab');
    this.mod = at;

    const isTab = opts.mode === 'tab';
    const api = new at.AlphaTabApi(container, {
      core: { engine: 'svg', fontDirectory: '/font/' },
      display: {
        scale: 0.9,
        // Piano: standard notation only. Guitar: alphaTab's default score+tab view.
        staveProfile: isTab ? at.StaveProfile.Default : at.StaveProfile.Score,
        resources: opts.resources,
      },
      player: {
        enablePlayer: true,
        enableCursor: true,
        enableAnimatedBeatCursor: true,
        // The shell owns interaction (click-to-hear/seek, drag-select, loop) uniformly for BOTH modes,
        // so piano and guitar behave identically — alphaTab's native selection UI stays off.
        enableUserInteraction: false,
        soundFont: '/soundfont/sonivox.sf2',
        scrollElement: container,
        scrollMode: at.ScrollMode.Continuous,
      },
    });
    this.api = api;

    api.playerPositionChanged.on((e) => {
      if (e.endTime > 0) this.durationMs = e.endTime;
      this.positionCb?.(e.currentTime, this.durationMs);
      // alphaTab stops (isLooping false) at the very end — reset the shell's play state.
      if (!api.isLooping && e.endTime > 0 && e.currentTime >= e.endTime - 30) this.endedCb?.();
    });
    api.playerStateChanged.on((e) => {
      // PlayerState.Playing === 1 (numeric literal is robust across build targets).
      this.stateCb?.(e.state === 1);
    });
    api.playerReady.on(() => this.readyCb?.());
    // alphaTab draws a "rendered by alphaTab" footer with no setting to disable it. The SVG partials
    // (incl. the footer) are appended asynchronously after renderFinished, so watch the container and
    // hide the annotation as soon as it lands — robust across the initial render + every re-render.
    // MPL-2.0 doesn't require the footer, and we keep source attribution in the score credit line.
    this.brandingObserver = new MutationObserver(() => this.hideBranding());
    this.brandingObserver.observe(container, { childList: true, subtree: true });

    return new Promise<ScoreLoadResult>((resolve, reject) => {
      let settled = false;
      api.scoreLoaded.on((score) => {
        if (isTab && opts.tuning?.length) this.applyTabTuning(score, opts.tuning, at);
        this.indexScore(score);
        this.durationMs = this.estimateDurationMs(score);
        if (!settled) {
          settled = true;
          resolve({
            durationMs: this.durationMs,
            baseBpm: Math.round(score.tempo || 120),
            barCount: this.barCount,
          });
        }
      });
      api.error.on((err) => {
        if (!settled) {
          settled = true;
          reject(err instanceof Error ? err : new Error('alphaTab failed to load the score'));
        }
      });
      if (!this.feed(source) && !settled) {
        settled = true;
        reject(new Error('alphaTab could not parse the score'));
      }
    });
  }

  /** Feed a source into the API. Canonical input is alphaTex; raw MusicXML/GuitarPro text is sniffed by
   * its leading `<`. Returns false only when a byte-load is rejected synchronously. */
  private feed(source: string): boolean {
    const api = this.api;
    if (!api) return false;
    if (source.trimStart().startsWith('<')) return api.load(new TextEncoder().encode(source));
    api.tex(source);
    return true;
  }

  /** Swap in a new score WITHOUT recreating the engine (worker/synth stay warm) — for tools that
   * regenerate notation repeatedly (exercises). Mode/tuning/theme from the original `load` still apply
   * (the `scoreLoaded` handler re-runs). */
  reload(source: string): void {
    this.feed(source);
  }

  /**
   * Make a pitched score render as tablature: give each staff a guitar/bass/ukulele tuning + tab display,
   * and assign every note a string/fret from its pitch (lowest-playable-fret heuristic — standard
   * auto-tab). The source scores are pitched (not fretted), so alphaTab needs both the tuning and the
   * per-note string/fret to draw tab. `tuning[0]` = string 1 (highest).
   */
  private applyTabTuning(score: model.Score, tuning: number[], at: AlphaTabModule): void {
    // Guitar + bass are written an octave ABOVE their sounding pitch (treble/bass clef, sounds 8vb), so
    // frets must be computed from the sounding pitch (written − 12). Ukulele is written at pitch. Detect
    // by the highest open string: guitar 64 / bass 43 are ≤ 66, ukulele's high A is 69.
    const transpose = Math.max(...tuning) <= 66 ? 12 : 0;
    // Always returns a valid string+fret (clamped): a note left with string 0 crashes alphaTab's tab
    // painter. Prefer the smallest in-range fret; otherwise the string whose fret is closest to 0..24.
    const assignFret = (written: number): { string: number; fret: number } => {
      const midi = written - transpose;
      let best: { string: number; fret: number } | null = null;
      let fallback = { string: tuning.length, fret: 0, dist: Infinity };
      for (let s = 1; s <= tuning.length; s += 1) {
        const fret = midi - tuning[s - 1];
        if (fret >= 0 && fret <= 24) {
          if (!best || fret < best.fret) best = { string: s, fret };
        } else {
          const clamped = Math.max(0, Math.min(24, fret));
          const dist = Math.abs(fret - clamped);
          if (dist < fallback.dist) fallback = { string: s, fret: clamped, dist };
        }
      }
      return best ?? { string: fallback.string, fret: fallback.fret };
    };
    const name =
      tuning.length === 6 ? 'Guitar' : tuning.length === 4 && transpose ? 'Bass' : 'Ukulele';
    for (const track of score.tracks) {
      for (const staff of track.staves) {
        // Skip staves already authored as fretted (their `fret.string` notes are intentional) — only
        // convert pitched staves (the catalogue scores) to tab.
        if (staff.isStringed) continue;
        staff.stringTuning = new at.model.Tuning(name, tuning.slice(), false);
        staff.showTablature = true;
        staff.showStandardNotation = true;
        for (const bar of staff.bars) {
          for (const voice of bar.voices) {
            for (const beat of voice.beats) {
              for (const note of beat.notes) {
                const placed = assignFret(note.realValue);
                note.string = placed.string;
                note.fret = placed.fret;
              }
            }
          }
        }
      }
    }
  }

  /** Index every beat by its absolute onset tick (track 0, voice 0) so a loop's endpoint ticks resolve
   * back to beats for highlighting; also record the bar count. */
  private indexScore(score: model.Score): void {
    this.beatsByTick.clear();
    const staff = score.tracks[0]?.staves[0];
    this.barCount = staff?.bars.length ?? 0;
    for (const bar of staff?.bars ?? []) {
      for (const beat of bar.voices[0]?.beats ?? []) {
        this.beatsByTick.set(beat.absolutePlaybackStart, beat);
      }
    }
  }

  /** Rough total length from the tempo + last bar (corrected live by playerPositionChanged.endTime). */
  private estimateDurationMs(score: model.Score): number {
    const bars = score.masterBars;
    if (!bars.length) return 0;
    const last = bars[bars.length - 1];
    const totalTicks = last.start + last.calculateDuration();
    const bpm = score.tempo > 0 ? score.tempo : 120;
    return (totalTicks / TICKS_PER_QUARTER) * (60000 / bpm);
  }

  onPosition(cb: (ms: number, durationMs: number) => void): void {
    this.positionCb = cb;
  }
  onState(cb: (playing: boolean) => void): void {
    this.stateCb = cb;
  }
  onReady(cb: () => void): void {
    this.readyCb = cb;
  }
  onEnded(cb: () => void): void {
    this.endedCb = cb;
  }

  play(): void {
    this.api?.play();
  }
  pause(): void {
    this.api?.pause();
  }
  stop(): void {
    this.api?.stop();
  }
  seekMs(ms: number): void {
    if (this.api) {
      this.api.timePosition = ms;
      this.positionCb?.(ms, this.durationMs);
    }
  }
  seekTick(tick: number): void {
    const api = this.api;
    if (!api) return;
    api.tickPosition = tick;
    this.positionCb?.(api.timePosition, this.durationMs);
  }
  setTempoFactor(factor: number): void {
    if (this.api) this.api.playbackSpeed = factor;
  }
  setMetronome(on: boolean): void {
    if (this.api) this.api.metronomeVolume = on ? 1 : 0;
  }
  setCountIn(on: boolean): void {
    if (this.api) this.api.countInVolume = on ? 1 : 0;
  }

  /** Resolve a beat range (endpoint onset ticks, either order) to its start + end beats, or null. */
  private beatsForRange(loop: LoopSelection): { start: model.Beat; end: model.Beat } | null {
    const start = this.beatsByTick.get(Math.min(loop.startTick, loop.endTick));
    const end = this.beatsByTick.get(Math.max(loop.startTick, loop.endTick));
    return start && end ? { start, end } : null;
  }

  highlightRange(loop: LoopSelection | null): void {
    const api = this.api;
    if (!api) return;
    if (!loop) {
      api.clearPlaybackRangeHighlight();
      return;
    }
    const beats = this.beatsForRange(loop);
    if (beats) api.highlightPlaybackRange(beats.start, beats.end); // overlay only — not applied/looped
  }

  applyRange(loop: LoopSelection): void {
    const api = this.api;
    if (!api) return;
    const beats = this.beatsForRange(loop);
    if (!beats) return;
    // alphaTab draws the selection overlay (.at-selection) + bounds playback to the beat-precise tick
    // range. Looping is controlled separately (setLooping) — bounded + not looping = play once & stop.
    api.highlightPlaybackRange(beats.start, beats.end);
    api.applyPlaybackRangeFromHighlight();
    // Cue the cursor at the selection start so Play begins the passage from its beginning.
    api.tickPosition = Math.min(loop.startTick, loop.endTick);
  }

  setLooping(on: boolean): void {
    if (this.api) this.api.isLooping = on;
  }

  clearRange(): void {
    const api = this.api;
    if (!api) return;
    api.clearPlaybackRangeHighlight();
    api.playbackRange = null;
    api.isLooping = false;
  }

  loopWhole(): void {
    const api = this.api;
    if (!api) return;
    api.clearPlaybackRangeHighlight();
    api.playbackRange = null;
    api.isLooping = true;
  }

  print(): void {
    this.api?.print();
  }

  /** Hide alphaTab's "rendered by alphaTab" footer text (an ungated SVG annotation). */
  private hideBranding(): void {
    const root = this.container;
    if (!root) return;
    for (const el of root.querySelectorAll('text')) {
      if (
        el.textContent?.trim() === 'rendered by alphaTab' &&
        el.getAttribute('display') !== 'none'
      ) {
        el.setAttribute('display', 'none');
      }
    }
  }

  playNote(midi: number): void {
    sampledPlayNote(midi, 0.8);
  }

  hitTest(clientX: number, clientY: number): ScoreHit | null {
    const api = this.api;
    const root = this.container;
    if (!api?.renderer.boundsLookup || !root) return null;
    const base = root.getBoundingClientRect();
    const x = clientX - base.left + root.scrollLeft;
    const y = clientY - base.top + root.scrollTop;
    const beat = api.renderer.boundsLookup.getBeatAtPos(x, y);
    if (!beat) return null;
    const midi = beat.notes.length ? beat.notes[0].realValue : undefined;
    return {
      midi: typeof midi === 'number' ? midi : undefined,
      tick: beat.absolutePlaybackStart,
      bar: beat.voice.bar.index,
    };
  }

  applyResources(resources: AlphaTabResources): void {
    const api = this.api;
    const at = this.mod;
    if (!api || !at) return;
    const res = api.settings.display.resources;
    const set = (key: keyof AlphaTabResources) => {
      const color = at.model.Color.fromJson(resources[key]);
      if (color) (res as unknown as Record<string, model.Color>)[key] = color;
    };
    set('mainGlyphColor');
    set('secondaryGlyphColor');
    set('staffLineColor');
    set('barSeparatorColor');
    set('barNumberColor');
    set('scoreInfoColor');
    api.updateSettings();
    api.render();
  }

  destroy(): void {
    this.brandingObserver?.disconnect();
    this.brandingObserver = null;
    this.api?.destroy();
    this.api = null;
    this.mod = null;
    if (this.container) this.container.innerHTML = '';
    this.container = null;
    this.beatsByTick.clear();
  }
}
