import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { GUITAR_CHORDS, strumChord } from '@/components/ChordDiagrams';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { playTone } from '@/lib/audio';
import { midiToFrequency, trebleStaffNotes } from '@/lib/music-theory';

const BY_NAME = new Map(trebleStaffNotes().map((n) => [n.name, n]));
const chordByName = (name: string) =>
  GUITAR_CHORDS.find((c) => c.name === name) ?? GUITAR_CHORDS[0];

interface Song {
  key: string;
  title: string;
  names: string[];
  beats: number[];
  /** One chord per bar (4 beats). */
  chords: string[];
}

const SONGS: Song[] = [
  {
    key: 'ode',
    title: 'Ode to Joy',
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
    beats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2],
    chords: ['C', 'C', 'G', 'C'],
  },
  {
    key: 'twinkle',
    title: 'Twinkle, Twinkle',
    names: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
    beats: [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2],
    chords: ['C', 'F', 'C', 'G'],
  },
];

interface SongNote extends StaffNoteDatum {
  midi: number;
  /** Bar index this note falls in (for the chord accompaniment). */
  bar: number;
  /** True when this note lands on the downbeat of its bar. */
  barStart: boolean;
}

function buildNotes(song: Song): SongNote[] {
  const notes: SongNote[] = [];
  let cumulative = 0;
  for (let i = 0; i < song.names.length; i += 1) {
    const base = BY_NAME.get(song.names[i]);
    const beats = song.beats[i] ?? 1;
    if (base) {
      notes.push({
        step: base.step,
        label: base.name,
        beats,
        midi: base.midi,
        bar: Math.floor(cumulative / 4) % song.chords.length,
        barStart: cumulative % 4 === 0,
      });
    }
    cumulative += beats;
  }
  return notes;
}

export default function SongPlayer() {
  const [songKey, setSongKey] = useState('ode');
  const [bpm, setBpm] = useState(96);
  const [chordsOn, setChordsOn] = useState(true);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(-1);
  const [currentBar, setCurrentBar] = useState(0);

  const song = SONGS.find((s) => s.key === songKey) ?? SONGS[0];
  const notes = buildNotes(song);

  const notesRef = useRef(notes);
  const songRef = useRef(song);
  const bpmRef = useRef(bpm);
  const chordsRef = useRef(chordsOn);
  const timerRef = useRef(0);
  useEffect(() => {
    notesRef.current = notes;
    songRef.current = song;
  });
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    chordsRef.current = chordsOn;
  }, [chordsOn]);

  useEffect(() => {
    if (!running) {
      return;
    }
    let i = 0;
    const step = () => {
      const seq = notesRef.current;
      const note = seq[i % seq.length];
      const secondsPerBeat = 60 / bpmRef.current;
      const beats = note.beats ?? 1;
      playTone(midiToFrequency(note.midi), beats * secondsPerBeat * 0.9);
      if (chordsRef.current && note.barStart) {
        strumChord(chordByName(songRef.current.chords[note.bar]).frets, 'down', secondsPerBeat * 3);
      }
      setActive(i % seq.length);
      setCurrentBar(note.bar);
      i += 1;
      timerRef.current = window.setTimeout(step, beats * secondsPerBeat * 1000);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setActive(-1);
    };
  }, [running, songKey]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Song</span>
          <Select
            value={songKey}
            onChange={(e) => setSongKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {SONGS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="rhythm">
            Tempo
          </span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={50}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={chordsOn}
            onChange={(e) => setChordsOn(e.target.checked)}
          />
          Chords
        </label>
      </div>

      <div className="flex gap-2">
        {song.chords.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className={`flex-1 rounded-md border px-2 py-1 text-center text-sm font-semibold ${
              running && currentBar === i ? 'border-blue-500 bg-blue-500/15' : 'border-border'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      <StaffSequence notes={notes} showLabels activeIndex={active} />

      <Button
        type="button"
        variant={running ? 'outline' : 'default'}
        className="px-6"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? (
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
      <p className="text-xs text-muted-foreground">
        Plays the melody on the staff with a strummed chord under each bar — the current chord is
        highlighted. Turn chords off to practise the melody alone, or slow the tempo to learn it.
      </p>
    </div>
  );
}
