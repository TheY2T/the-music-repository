import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import AudioVisualizer from '@/components/AudioVisualizer';
import { getAudioContext, scheduleDrum, scheduleTone } from '@/lib/audio';
import { midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

// Chord shapes (semitone offsets from the chord root).
const MAJ = [0, 4, 7];
const MIN = [0, 3, 7];
const DOM7 = [0, 4, 7, 10];
const MIN7 = [0, 3, 7, 10];
const MAJ7 = [0, 4, 7, 11];

interface Chord {
  /** Semitones above the key root. */
  rootOffset: number;
  intervals: number[];
  roman: string;
  /** Suffix appended to the chord's root name (e.g. "7", "m", "maj7"). */
  suffix: string;
}

const ch = (rootOffset: number, intervals: number[], roman: string, suffix: string): Chord => ({
  rootOffset,
  intervals,
  roman,
  suffix,
});

interface Progression {
  key: string;
  title: string;
  bars: Chord[];
}

const I7 = ch(0, DOM7, 'I7', '7');
const IV7 = ch(5, DOM7, 'IV7', '7');
const V7 = ch(7, DOM7, 'V7', '7');

const PROGRESSIONS: Progression[] = [
  {
    key: 'blues',
    title: '12-bar blues',
    bars: [I7, I7, I7, I7, IV7, IV7, I7, I7, V7, IV7, I7, V7],
  },
  {
    key: 'pop',
    title: 'I–V–vi–IV (pop)',
    bars: [ch(0, MAJ, 'I', ''), ch(7, MAJ, 'V', ''), ch(9, MIN, 'vi', 'm'), ch(5, MAJ, 'IV', '')],
  },
  {
    key: 'fifties',
    title: 'I–vi–IV–V (50s)',
    bars: [ch(0, MAJ, 'I', ''), ch(9, MIN, 'vi', 'm'), ch(5, MAJ, 'IV', ''), ch(7, MAJ, 'V', '')],
  },
  {
    key: 'jazz',
    title: 'ii–V–I (jazz)',
    bars: [ch(2, MIN7, 'ii', 'm7'), V7, ch(0, MAJ7, 'I', 'maj7'), ch(0, MAJ7, 'I', 'maj7')],
  },
];

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.2;
const BEATS_PER_BAR = 4;

interface Parts {
  drums: boolean;
  bass: boolean;
  chords: boolean;
}

/** Schedule one beat of the arrangement (drums + walking bass + comping chords). */
function scheduleBeat(
  keyRoot: number,
  chord: Chord,
  beat: number,
  time: number,
  secPerBeat: number,
  parts: Parts,
): void {
  const halfBeat = secPerBeat / 2;
  const rootPc = (keyRoot + chord.rootOffset) % 12;

  if (parts.drums) {
    scheduleDrum('hihat', time);
    scheduleDrum('hihat', time + halfBeat);
    if (beat === 0 || beat === 2) {
      scheduleDrum('kick', time);
    }
    if (beat === 1 || beat === 3) {
      scheduleDrum('snare', time);
    }
  }

  if (parts.bass) {
    // Root on beat 1, fifth on beat 3 — a simple walking outline.
    if (beat === 0) {
      scheduleTone(midiToFrequency(36 + rootPc), time, secPerBeat * 0.9, {
        type: 'sine',
        gain: 0.4,
      });
    }
    if (beat === 2) {
      scheduleTone(midiToFrequency(36 + rootPc + 7), time, secPerBeat * 0.9, {
        type: 'sine',
        gain: 0.4,
      });
    }
  }

  if (parts.chords && (beat === 1 || beat === 3)) {
    // Off-beat comping stabs in the mid register.
    for (const interval of chord.intervals) {
      scheduleTone(midiToFrequency(48 + rootPc + interval), time, secPerBeat * 0.5, {
        type: 'triangle',
        gain: 0.1,
      });
    }
  }
}

export default function BackingTrack() {
  const [keyRoot, setKeyRoot] = useState(0);
  const [progKey, setProgKey] = useState('blues');
  const [bpm, setBpm] = useState(100);
  const [parts, setParts] = useState<Parts>({ drums: true, bass: true, chords: true });
  const [running, setRunning] = useState(false);
  const [currentBar, setCurrentBar] = useState(-1);

  const progression = PROGRESSIONS.find((p) => p.key === progKey) ?? PROGRESSIONS[0];

  const keyRef = useRef(keyRoot);
  const progRef = useRef(progression);
  const bpmRef = useRef(bpm);
  const partsRef = useRef(parts);
  const barRef = useRef(0);
  const beatRef = useRef(0);
  const nextTimeRef = useRef(0);

  useEffect(() => {
    keyRef.current = keyRoot;
  }, [keyRoot]);
  useEffect(() => {
    progRef.current = progression;
  }, [progression]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    partsRef.current = parts;
  }, [parts]);

  useEffect(() => {
    if (!running) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) {
      setRunning(false);
      return;
    }
    nextTimeRef.current = ctx.currentTime + 0.1;
    barRef.current = 0;
    beatRef.current = 0;

    function scheduler() {
      const context = getAudioContext();
      if (!context) {
        return;
      }
      while (nextTimeRef.current < context.currentTime + SCHEDULE_AHEAD_S) {
        const bars = progRef.current.bars;
        const beat = beatRef.current;
        const bar = barRef.current;
        const chord = bars[bar];
        const time = nextTimeRef.current;
        const secPerBeat = 60 / bpmRef.current;
        scheduleBeat(keyRef.current, chord, beat, time, secPerBeat, partsRef.current);
        if (beat === 0) {
          const delayMs = Math.max(0, (time - context.currentTime) * 1000);
          window.setTimeout(() => setCurrentBar(bar), delayMs);
        }
        nextTimeRef.current += secPerBeat;
        beatRef.current = beat + 1;
        if (beatRef.current >= BEATS_PER_BAR) {
          beatRef.current = 0;
          barRef.current = (bar + 1) % bars.length;
        }
      }
    }

    scheduler();
    const timer = window.setInterval(scheduler, LOOKAHEAD_MS);
    return () => {
      window.clearInterval(timer);
      setCurrentBar(-1);
    };
  }, [running]);

  function chordName(chord: Chord): string {
    return pitchName((keyRoot + chord.rootOffset) % 12) + chord.suffix;
  }

  return (
    <div className="space-y-5">
      {/* Decorative spectrum of the live mix (drums + bass + comping route through the audio bus). */}
      <AudioVisualizer />
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Key</span>
          <Select
            value={keyRoot}
            onChange={(e) => setKeyRoot(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {ROOT_CHOICES.map((pc) => (
              <option key={pc} value={pc}>
                {pitchName(pc)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="chords">
            Progression
          </span>
          <Select
            value={progKey}
            onChange={(e) => setProgKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {PROGRESSIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.title}
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
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {(['drums', 'bass', 'chords'] as const).map((part) => (
          <label key={part} className="flex items-center gap-2 capitalize">
            <input
              type="checkbox"
              checked={parts[part]}
              onChange={(e) => setParts((prev) => ({ ...prev, [part]: e.target.checked }))}
            />
            {part}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {progression.bars.map((chord, index) => (
          <div
            key={`${chord.roman}-${index}`}
            className={`flex flex-col items-center rounded-md border p-3 transition-colors ${
              running && currentBar === index
                ? 'border-blue-500 bg-blue-500/15'
                : 'border-border bg-transparent'
            }`}
          >
            <span className="text-lg font-semibold">{chordName(chord)}</span>
            <span className="text-xs text-muted-foreground">{chord.roman}</span>
          </div>
        ))}
      </div>

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
            Play along
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Loops the chosen progression with drums, bass, and comping chords — jam over it on any
        instrument. Change key, progression, or tempo live; mute parts to practise a role.
      </p>
    </div>
  );
}
