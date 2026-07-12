import { Button, Icon, Textarea } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { getAudioContext, scheduleTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

/** Minimal shape of the Verovio toolkit we use. */
interface VerovioToolkitLike {
  setOptions(options: Record<string, unknown>): void;
  loadData(data: string): boolean;
  renderToSVG(page: number): string;
  renderToTimemap(options?: Record<string, unknown>): TimemapEntry[];
  getElementsAtTime(millisec: number): { notes?: string[]; page?: number };
  getMIDIValuesForElement(xmlId: string): { pitch?: number; duration?: number };
}

/** One moment in Verovio's timemap: note ids that start (`on`) at `tstamp` ms. */
interface TimemapEntry {
  tstamp: number;
  on?: string[];
}

/** A single scheduled note extracted from the timemap. */
interface ScheduledNote {
  time: number; // ms from the start of the score, as written (tempo = 1×)
  pitch: number; // MIDI note number
  duration: number; // ms
}

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>half</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

const HIGHLIGHT = '#dc2626'; // red-600 — the play-head colour for sounding notes.

export default function ScoreRenderer() {
  const [xml, setXml] = useState(SAMPLE);
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('Loading the notation engine…');
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(1); // playback speed multiplier
  const toolkitRef = useRef<VerovioToolkitLike | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<ScheduledNote[]>([]);
  const totalMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const tempoRef = useRef(1);
  const highlightedRef = useRef<Set<string>>(new Set());
  tempoRef.current = tempo;

  function render(data: string) {
    const tk = toolkitRef.current;
    if (!tk) {
      return;
    }
    try {
      tk.setOptions({
        scale: 40,
        adjustPageHeight: true,
        pageWidth: 2100,
        footer: 'none',
        header: 'none',
      });
      if (!tk.loadData(data)) {
        setMessage('Could not parse the score — is it valid MusicXML/MEI?');
        setSvg('');
        notesRef.current = [];
        return;
      }
      setSvg(tk.renderToSVG(1));
      setMessage('');
      // Build the playback schedule from Verovio's timemap.
      const timemap = tk.renderToTimemap({ includeMeasures: false });
      const notes: ScheduledNote[] = [];
      let last = 0;
      for (const entry of timemap) {
        if (!entry.on) {
          continue;
        }
        for (const id of entry.on) {
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
    } catch {
      setMessage('Render error.');
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [esm, wasm] = await Promise.all([import('verovio/esm'), import('verovio/wasm')]);
        const createModule = (wasm as { default: () => Promise<unknown> }).default;
        const module = await createModule();
        if (cancelled) {
          return;
        }
        const Toolkit = (esm as { VerovioToolkit: new (m: unknown) => VerovioToolkitLike })
          .VerovioToolkit;
        toolkitRef.current = new Toolkit(module);
        setStatus('ready');
        render(xml);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Could not load the notation engine (Verovio).');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only initialise once.
  }, []);

  // Paint the given note ids as the play-head; clear everything else.
  function highlight(ids: string[]) {
    const root = containerRef.current;
    if (!root) {
      return;
    }
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
    if (!tk || !ctx || notes.length === 0) {
      return;
    }
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
    // rAF cursor: map real elapsed time back to score time and ask Verovio what's sounding.
    const startPerf = performance.now();
    const total = totalMsRef.current;
    const tick = () => {
      const elapsed = performance.now() - startPerf;
      const scoreTime = elapsed * tempoRef.current;
      const active = tk.getElementsAtTime(scoreTime);
      highlight(active.notes ?? []);
      if (scoreTime >= total + 250) {
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // Stop playback + cursor when the component unmounts.
  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  const canPlay = status === 'ready' && notesRef.current.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium">
          Upload MusicXML / MEI
          <input
            type="file"
            accept=".xml,.musicxml,.mei,text/xml,application/xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                file.text().then((t) => {
                  stop();
                  setXml(t);
                  render(t);
                });
              }
            }}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            stop();
            setXml(SAMPLE);
            render(SAMPLE);
          }}
          disabled={status !== 'ready'}
        >
          Load sample
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            stop();
            render(xml);
          }}
          disabled={status !== 'ready'}
        >
          Render
        </Button>
        <Button type="button" onClick={() => (playing ? stop() : play())} disabled={!canPlay}>
          {playing ? (
            <>
              <Icon name="square" className="size-3 fill-current" />
              Stop
            </>
          ) : (
            <>
              <Icon name="play" className="size-4" />
              Play
            </>
          )}
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Speed</span>
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

      {message ? (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
          {message}
        </p>
      ) : null}

      {svg ? (
        <div
          ref={containerRef}
          className="overflow-x-auto rounded-lg border border-border bg-white p-2"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Verovio renders trusted SVG markup from the score.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Edit MusicXML source</summary>
        <Textarea
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          spellCheck={false}
          className="mt-2 h-48 p-2 font-mono text-xs"
        />
      </details>
      <p className="text-xs text-muted-foreground">
        Full engraving via <strong>Verovio</strong> (WASM) — multi-voice, beaming, slurs, and
        dynamics that the built-in minimal renderer can't do. <strong>Play</strong> hears the score
        with a moving highlight synced to the notation (Verovio timemap → Web Audio). Upload a
        `.musicxml`/`.mei` file or edit the source.
      </p>
    </div>
  );
}
