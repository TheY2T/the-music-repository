import { Icon, Select } from '@TheY2T/tmr-ui';
import { ChordDiagram, generateCagedShapes } from '@TheY2T/tmr-ui/music';
import { useState } from 'react';
import { strumChord } from '@/components/ChordDiagrams';
import InstrumentLoading from '@/components/InstrumentLoading';
import InstrumentPicker from '@/components/InstrumentPicker';
import { useToolInstrument } from '@/lib/instrument-choice';
import { CHORDS, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

// The qualities the CAGED system voices across the neck (major = all five shapes; minor / 7ths = the
// practical subset the shape generator supplies).
const CAGED_QUALITIES = ['major', 'minor', 'dominant-7', 'major-7', 'minor-7'];
const QUALITY_OPTIONS = CAGED_QUALITIES.map((key) => ({
  key,
  label: CHORDS.find((c) => c.key === key)?.name ?? key,
}));

export default function CagedExplorer() {
  const [root, setRoot] = useState(0);
  const [quality, setQuality] = useState('major');
  const { instrument, setInstrument, ready } = useToolInstrument('guitar');
  const shapes = generateCagedShapes(root, quality);
  const qualityName = CHORDS.find((c) => c.key === quality)?.name ?? quality;

  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <InstrumentPicker value={instrument} onChange={setInstrument} />
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Root</span>
          <Select
            value={root}
            onChange={(e) => setRoot(Number(e.target.value))}
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
            Chord type
          </span>
          <Select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {QUALITY_OPTIONS.map((q) => (
              <option key={q.key} value={q.key}>
                {q.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {shapes.map((shape) => (
          <button
            key={shape.family}
            type="button"
            onClick={() => strumChord(shape.frets)}
            className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
          >
            <span className="font-semibold">{shape.family}</span>
            <ChordDiagram chord={shape} />
            <span className="text-xs text-muted-foreground">
              <Icon name="play" className="size-4" />
              Strum
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        The same {pitchName(root)} {qualityName} chord in its CAGED shapes up the neck (C–A–G–E–D).
        The fret label to the left of a diagram is its starting fret. Minor and 7th chords show the
        shapes that voice cleanly. Learn how the shapes connect to play any chord anywhere.
      </p>
    </div>
  );
}
