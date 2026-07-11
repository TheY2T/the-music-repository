import { playTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

const CONCERT_A = { label: 'A', octave: 4, midi: 69 };

/** Standard guitar tuning, thickest string (6) to thinnest (1). */
const GUITAR_STRINGS = [
  { string: 6, note: 'E', midi: 40 },
  { string: 5, note: 'A', midi: 45 },
  { string: 4, note: 'D', midi: 50 },
  { string: 3, note: 'G', midi: 55 },
  { string: 2, note: 'B', midi: 59 },
  { string: 1, note: 'E', midi: 64 },
];

function ReferenceButton({ midi, label }: { midi: number; label: string }) {
  const hz = Math.round(midiToFrequency(midi) * 10) / 10;
  return (
    <button
      type="button"
      onClick={() => playTone(midiToFrequency(midi), 1.8)}
      className="flex flex-col items-center rounded-lg border border-border px-5 py-3 hover:bg-muted"
    >
      <span className="text-xl font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{hz} Hz</span>
    </button>
  );
}

export default function TuningReference() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-medium">Concert pitch</h2>
        <ReferenceButton midi={CONCERT_A.midi} label={`${CONCERT_A.label}${CONCERT_A.octave}`} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Guitar — standard tuning</h2>
        <div className="flex flex-wrap gap-3">
          {GUITAR_STRINGS.map((s) => (
            <ReferenceButton key={s.string} midi={s.midi} label={`${s.string} · ${s.note}`} />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Tap a note to hear a steady reference tone, then tune your string to match it by ear.
      </p>
    </div>
  );
}
