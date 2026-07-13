import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { getAudioContext, scheduleTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

/**
 * Read-only engraved-score viewer for catalogue detail pages. Fetches a MusicXML asset, engraves it
 * with Verovio (WASM, dynamically imported), and plays it back with a moving highlight synced to the
 * notation (Verovio timemap → Web Audio). A lean, i18n-by-prop sibling of the `/tools/score`
 * `ScoreRenderer` (which adds upload/edit/sample chrome). See docs/features/catalogue.md.
 */
interface VerovioToolkitLike {
  setOptions(options: Record<string, unknown>): void;
  loadData(data: string): boolean;
  renderToSVG(page: number): string;
  renderToTimemap(options?: Record<string, unknown>): { tstamp: number; on?: string[] }[];
  getElementsAtTime(millisec: number): { notes?: string[] };
  getMIDIValuesForElement(xmlId: string): { pitch?: number; duration?: number };
}

interface ScheduledNote {
  time: number;
  pitch: number;
  duration: number;
}

const HIGHLIGHT = '#b3402f'; // oxblood play-head; notation coloring (exempt from token rule).

export default function ScoreViewer({ url, locale }: { url: string; locale: Locale }) {
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(1);
  const toolkitRef = useRef<VerovioToolkitLike | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<ScheduledNote[]>([]);
  const totalMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const tempoRef = useRef(1);
  const highlightedRef = useRef<Set<string>>(new Set());
  tempoRef.current = tempo;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [esm, wasm, xml] = await Promise.all([
          import('verovio/esm'),
          import('verovio/wasm'),
          fetch(url).then((r) => r.text()),
        ]);
        const createModule = (wasm as { default: () => Promise<unknown> }).default;
        const module = await createModule();
        if (cancelled) return;
        const Toolkit = (esm as { VerovioToolkit: new (m: unknown) => VerovioToolkitLike })
          .VerovioToolkit;
        const tk = new Toolkit(module);
        toolkitRef.current = tk;
        tk.setOptions({
          scale: 40,
          adjustPageHeight: true,
          pageWidth: 2100,
          footer: 'none',
          header: 'none',
        });
        if (!tk.loadData(xml)) {
          setStatus('error');
          return;
        }
        setSvg(tk.renderToSVG(1));
        const notes: ScheduledNote[] = [];
        let last = 0;
        for (const entry of tk.renderToTimemap({ includeMeasures: false })) {
          for (const id of entry.on ?? []) {
            const midi = tk.getMIDIValuesForElement(id);
            if (typeof midi?.pitch === 'number') {
              const duration = midi.duration ?? 400;
              notes.push({ time: entry.tstamp, pitch: midi.pitch, duration });
              last = Math.max(last, entry.tstamp + duration);
            }
          }
        }
        notesRef.current = notes;
        totalMsRef.current = last;
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  function highlight(ids: string[]) {
    const root = containerRef.current;
    if (!root) return;
    const next = new Set(ids);
    for (const id of highlightedRef.current) {
      if (!next.has(id)) {
        (root.querySelector(`#${CSS.escape(id)}`) as SVGElement | null)?.style.removeProperty(
          'fill',
        );
      }
    }
    for (const id of next) {
      (root.querySelector(`#${CSS.escape(id)}`) as SVGElement | null)?.style.setProperty(
        'fill',
        HIGHLIGHT,
      );
    }
    highlightedRef.current = next;
  }

  function stop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    highlight([]);
    setPlaying(false);
  }

  function play() {
    const tk = toolkitRef.current;
    const ctx = getAudioContext();
    const notes = notesRef.current;
    if (!tk || !ctx || notes.length === 0) return;
    stop();
    setPlaying(true);
    const speed = tempoRef.current;
    const startAudio = ctx.currentTime + 0.1;
    for (const note of notes) {
      scheduleTone(
        midiToFrequency(note.pitch),
        startAudio + note.time / 1000 / speed,
        Math.min(note.duration / 1000 / speed, 2),
        { type: 'triangle', gain: 0.22 },
      );
    }
    const startPerf = performance.now();
    const total = totalMsRef.current;
    const tick = () => {
      const scoreTime = (performance.now() - startPerf) * tempoRef.current;
      highlight(tk.getElementsAtTime(scoreTime).notes ?? []);
      if (scoreTime >= total + 250) {
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  if (status === 'error') {
    return <p className="text-sm text-destructive">{t(locale, 'score.error')}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => (playing ? stop() : play())}
          disabled={status !== 'ready'}
        >
          {playing ? (
            <>
              <Icon name="square" className="size-3 fill-current" />
              {t(locale, 'score.stop')}
            </>
          ) : (
            <>
              <Icon name="play" className="size-4" />
              {t(locale, 'score.play')}
            </>
          )}
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t(locale, 'score.speed')}</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
          />
          <span className="w-10 tabular-nums">{tempo.toFixed(1)}×</span>
        </label>
      </div>

      {status === 'loading' ? (
        <p className="text-sm text-muted-foreground">{t(locale, 'score.loading')}</p>
      ) : null}

      {svg ? (
        <div
          ref={containerRef}
          className="overflow-x-auto rounded-lg border border-border p-2"
          // Notation must sit on a light "paper" surface so the black engraving stays legible in
          // every theme (Verovio renders black glyphs). Warm off-white to fit the vintage look.
          style={{ background: '#fbfaf5' }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Verovio renders trusted SVG from the score.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}
    </div>
  );
}
