import { useEffect, useRef, useState } from 'react';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { playTone } from '@/lib/audio';
import { midiToFrequency, staffPlacement } from '@/lib/music-theory';

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

interface ImportedNote extends StaffNoteDatum {
  midi: number;
}

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>2</divisions><clef><sign>G</sign><line>2</line></clef></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave><alter>1</alter></pitch><duration>2</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><rest/><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave><alter>-1</alter></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

interface ParseResult {
  notes: ImportedNote[];
  error?: string;
}

/** Parse a single-voice MusicXML score into staff notes using the browser's DOMParser. */
function parseMusicXml(xml: string): ParseResult {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) {
    return { notes: [], error: 'Could not parse the file as XML.' };
  }
  const part = doc.querySelector('part');
  if (!part) {
    return { notes: [], error: 'No <part> found — is this a MusicXML score?' };
  }
  const notes: ImportedNote[] = [];
  let divisions = 1;
  for (const measure of Array.from(part.querySelectorAll('measure'))) {
    const div = measure.querySelector('attributes > divisions');
    if (div?.textContent) {
      divisions = Number(div.textContent) || divisions;
    }
    for (const note of Array.from(measure.querySelectorAll('note'))) {
      // Skip secondary chord notes — this importer reads a single voice.
      if (note.querySelector('chord')) {
        continue;
      }
      const beats = Number(note.querySelector('duration')?.textContent ?? divisions) / divisions;
      if (note.querySelector('rest')) {
        notes.push({ step: 4, label: 'rest', beats, rest: true, midi: -1 });
        continue;
      }
      const pitch = note.querySelector('pitch');
      if (!pitch) {
        continue;
      }
      const step = pitch.querySelector('step')?.textContent ?? 'C';
      const octave = Number(pitch.querySelector('octave')?.textContent ?? 4);
      const alter = Number(pitch.querySelector('alter')?.textContent ?? 0);
      const midi = 12 * (octave + 1) + (LETTER_PC[step] ?? 0) + alter;
      const placement = staffPlacement(midi, alter < 0);
      notes.push({
        step: placement.step,
        label: placement.label,
        accidental: placement.accidental,
        beats,
        midi,
      });
    }
  }
  if (notes.length === 0) {
    return { notes: [], error: 'No notes found in the score.' };
  }
  return { notes };
}

export default function MusicXmlImport() {
  const [xml, setXml] = useState(SAMPLE);
  const [result, setResult] = useState<ParseResult>({ notes: [] });
  const [bpm, setBpm] = useState(100);
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);

  const notesRef = useRef<ImportedNote[]>([]);
  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Parse on mount and whenever the text changes.
  useEffect(() => {
    const parsed = parseMusicXml(xml);
    setResult(parsed);
    notesRef.current = parsed.notes;
  }, [xml]);

  useEffect(() => {
    if (!running || notesRef.current.length === 0) {
      return;
    }
    let i = 0;
    const step = () => {
      const seq = notesRef.current;
      const note = seq[i % seq.length];
      const beats = note.beats ?? 1;
      if (!note.rest) {
        playTone(midiToFrequency(note.midi), beats * (60 / bpmRef.current) * 0.9);
      }
      setActive(i % seq.length);
      i += 1;
      if (i >= seq.length) {
        setRunning(false);
        return;
      }
      timerRef.current = window.setTimeout(step, beats * (60 / bpmRef.current) * 1000);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setActive(-1);
    };
  }, [running]);

  function onFile(file: File) {
    file.text().then(setXml);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium">
          Upload .musicxml / .xml
          <input
            type="file"
            accept=".xml,.musicxml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFile(file);
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setXml(SAMPLE)}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium"
        >
          Load sample
        </button>
        <label className="flex items-center gap-2 text-sm" data-help="rhythm">
          Tempo
          <input
            type="range"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-32"
            aria-label="Tempo (BPM)"
          />
          <span className="w-14 tabular-nums text-muted-foreground">{bpm} BPM</span>
        </label>
      </div>

      {result.error ? (
        <p className="text-sm text-red-600">{result.error}</p>
      ) : (
        <>
          <StaffSequence notes={result.notes} showLabels activeIndex={active} />
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className={`rounded-md px-6 py-2 text-sm font-medium ${
              running ? 'border border-border' : 'bg-primary text-primary-foreground'
            }`}
          >
            {running ? '■ Stop' : '▶ Play'}
          </button>
        </>
      )}

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
        Renders a single-voice MusicXML score on the staff (pitch, accidentals, note values, rests)
        and plays it — parsed entirely in the browser, no plugins. Upload a `.musicxml`/`.xml` file
        or paste one above.
      </p>
    </div>
  );
}
