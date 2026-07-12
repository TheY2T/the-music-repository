import { useEffect, useRef, useState } from 'react';

/** Minimal shape of the Verovio toolkit we use. */
interface VerovioToolkitLike {
  setOptions(options: Record<string, unknown>): void;
  loadData(data: string): boolean;
  renderToSVG(page: number): string;
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

export default function ScoreRenderer() {
  const [xml, setXml] = useState(SAMPLE);
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('Loading the notation engine…');
  const toolkitRef = useRef<VerovioToolkitLike | null>(null);

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
        return;
      }
      setSvg(tk.renderToSVG(1));
      setMessage('');
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
                  setXml(t);
                  render(t);
                });
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setXml(SAMPLE);
            render(SAMPLE);
          }}
          disabled={status !== 'ready'}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          Load sample
        </button>
        <button
          type="button"
          onClick={() => render(xml)}
          disabled={status !== 'ready'}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          Render
        </button>
      </div>

      {message ? (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
          {message}
        </p>
      ) : null}

      {svg ? (
        <div
          className="overflow-x-auto rounded-lg border border-border bg-white p-2"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Verovio renders trusted SVG markup from the score.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Edit MusicXML source</summary>
        <textarea
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          spellCheck={false}
          className="mt-2 h-48 w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
        />
      </details>
      <p className="text-xs text-muted-foreground">
        Full engraving via <strong>Verovio</strong> (WASM) — multi-voice, beaming, slurs, and
        dynamics that the built-in minimal renderer can't do. Upload a `.musicxml`/`.mei` file or
        edit the source.
      </p>
    </div>
  );
}
