import { useEffect, useRef, useState } from 'react';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { playTone } from '@/lib/audio';
import { midiToFrequency, trebleStaffNotes } from '@/lib/music-theory';

// Name → staff position lookup for the treble naturals (C4–C6).
const BY_NAME = new Map(trebleStaffNotes().map((n) => [n.name, n]));

interface PlayerNote extends StaffNoteDatum {
  midi: number;
}

function toNotes(names: string[]): PlayerNote[] {
  return names.flatMap((name) => {
    const note = BY_NAME.get(name);
    return note ? [{ step: note.step, label: note.name, midi: note.midi }] : [];
  });
}

// Public-domain melodies (single-line, natural notes only).
const PIECES = [
  {
    key: 'ode',
    title: 'Ode to Joy — Beethoven',
    names: [
      'E4',
      'E4',
      'F4',
      'G4',
      'G4',
      'F4',
      'E4',
      'D4',
      'C4',
      'C4',
      'D4',
      'E4',
      'E4',
      'D4',
      'D4',
    ],
  },
  {
    key: 'twinkle',
    title: 'Twinkle, Twinkle',
    names: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
  },
  {
    key: 'mary',
    title: 'Mary Had a Little Lamb',
    names: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4'],
  },
  {
    key: 'scale',
    title: 'C major scale',
    names: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  },
];

export default function NotationPlayer() {
  const [pieceKey, setPieceKey] = useState('ode');
  const [bpm, setBpm] = useState(100);
  const [loop, setLoop] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(-1);

  const piece = PIECES.find((p) => p.key === pieceKey) ?? PIECES[0];
  const notes = toNotes(piece.names);
  const lastIndex = notes.length - 1;

  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(lastIndex);

  const bpmRef = useRef(bpm);
  const loopRef = useRef(loop);
  const startRef = useRef(loopStart);
  const endRef = useRef(loopEnd);
  const idxRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);
  useEffect(() => {
    startRef.current = loopStart;
  }, [loopStart]);
  useEffect(() => {
    endRef.current = loopEnd;
  }, [loopEnd]);

  // Reset the loop region to the whole piece when the selection changes.
  useEffect(() => {
    setPlaying(false);
    setLoopStart(0);
    setLoopEnd(lastIndex);
  }, [lastIndex]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    idxRef.current = startRef.current;
    let timer = 0;

    function step() {
      const i = idxRef.current;
      setActive(i);
      playTone(midiToFrequency(notes[i].midi), (60 / bpmRef.current) * 0.9);
      timer = window.setTimeout(() => {
        let next = i + 1;
        if (next > endRef.current) {
          if (!loopRef.current) {
            setPlaying(false);
            return;
          }
          next = startRef.current;
        }
        idxRef.current = next;
        step();
      }, 60000 / bpmRef.current);
    }

    step();
    return () => {
      window.clearTimeout(timer);
      setActive(-1);
    };
    // notes is derived from pieceKey; lastIndex effect stops playback on change.
  }, [playing, pieceKey]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Piece</span>
          <select
            value={pieceKey}
            onChange={(e) => setPieceKey(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {PIECES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="rhythm">
            Tempo
          </span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={40}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Loop
        </label>
      </div>

      <StaffSequence notes={notes} showLabels activeIndex={active} />

      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Section from note</span>
          <input
            type="range"
            min={0}
            max={lastIndex}
            value={loopStart}
            onChange={(e) => setLoopStart(Math.min(Number(e.target.value), loopEnd))}
            className="w-40"
            aria-label="Section start"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">to note</span>
          <input
            type="range"
            min={0}
            max={lastIndex}
            value={loopEnd}
            onChange={(e) => setLoopEnd(Math.max(Number(e.target.value), loopStart))}
            className="w-40"
            aria-label="Section end"
          />
        </label>
        <span className="text-sm text-muted-foreground">
          Notes {loopStart + 1}–{loopEnd + 1} of {notes.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className={`rounded-md px-6 py-2 text-sm font-medium ${
          playing ? 'border border-border' : 'bg-primary text-primary-foreground'
        }`}
      >
        {playing ? '■ Stop' : '▶ Play'}
      </button>
      <p className="text-xs text-muted-foreground">
        Follow the moving cursor as each note sounds. Slow the tempo to learn a tricky passage, set
        a section to drill just those bars, and loop it until it’s under your fingers.
      </p>
    </div>
  );
}
