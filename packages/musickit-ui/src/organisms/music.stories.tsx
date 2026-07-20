import type { ChordShape } from '@TheY2T/tmr-music-core/chord-shapes';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  buildPianoVoicings,
  ChordDiagram,
  GUITAR_CHORDS,
  KeyboardChordDiagram,
  type StaffNoteDatum,
  StaffSequence,
  UKULELE_CHORDS,
} from './index';

// Curated stories for the music-domain organisms (presentational primitives). The full
// "render everything" catalogue lives in the central storybook package's MusicKit Gallery.
const meta: Meta = { title: 'MusicKit UI/Organisms' };
export default meta;

export const ChordDiagrams: StoryObj = {
  name: 'ChordDiagram — guitar open shapes',
  render: () => (
    <div className="flex flex-wrap gap-6">
      {GUITAR_CHORDS.slice(0, 8).map((chord) => (
        <div key={chord.name} className="flex flex-col items-center gap-1">
          <ChordDiagram chord={chord} />
          <span className="text-sm text-muted-foreground">{chord.name}</span>
        </div>
      ))}
    </div>
  ),
};

export const UkuleleChordDiagrams: StoryObj = {
  name: 'ChordDiagram — ukulele (4-string)',
  render: () => (
    <div className="flex flex-wrap gap-6">
      {UKULELE_CHORDS.slice(0, 6).map((chord) => (
        <div key={chord.name} className="flex flex-col items-center gap-1">
          <ChordDiagram chord={chord} />
          <span className="text-sm text-muted-foreground">{chord.name}</span>
        </div>
      ))}
    </div>
  ),
};

// A C-major scale up the treble staff (step 0 = middle C in StaffSequence's coordinate space).
const C_MAJOR: StaffNoteDatum[] = [
  { step: 0, label: 'C' },
  { step: 1, label: 'D' },
  { step: 2, label: 'E' },
  { step: 3, label: 'F' },
  { step: 4, label: 'G' },
  { step: 5, label: 'A' },
  { step: 6, label: 'B' },
  { step: 7, label: 'C' },
];

export const Staff: StoryObj = {
  name: 'StaffSequence — C major scale',
  render: () => <StaffSequence notes={C_MAJOR} showLabels activeIndex={2} />,
};

// Barre + finger-numbered shapes: E-shape F barre, A-shape B♭, movable C at fret 3.
const FINGERED_SHAPES: ChordShape[] = [
  {
    name: 'F',
    quality: 'barre',
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [1],
  },
  {
    name: 'B♭',
    quality: 'barre',
    frets: [-1, 1, 3, 3, 3, 1],
    fingers: [0, 1, 2, 3, 4, 1],
    barres: [1],
    baseFret: 1,
  },
  {
    name: 'C',
    quality: 'major',
    frets: [3, 3, 5, 5, 5, 3],
    fingers: [1, 1, 2, 3, 4, 1],
    barres: [3],
    baseFret: 3,
  },
];

export const FingeredChords: StoryObj = {
  name: 'ChordDiagram — fingers + barres',
  render: () => (
    <div className="flex flex-wrap gap-6">
      {FINGERED_SHAPES.map((chord) => (
        <div key={chord.name} className="flex flex-col items-center gap-1">
          <ChordDiagram chord={chord} />
          <span className="text-sm text-muted-foreground">{chord.name}</span>
        </div>
      ))}
    </div>
  ),
};

export const KeyboardChords: StoryObj = {
  name: 'KeyboardChordDiagram — Cmaj7 voicings',
  render: () => (
    <div className="flex flex-wrap gap-6">
      {buildPianoVoicings(60, [0, 4, 7, 11]).map((voicing) => (
        <div key={voicing.key} className="flex flex-col items-center gap-1">
          <KeyboardChordDiagram midis={voicing.midis} label={voicing.name} />
        </div>
      ))}
    </div>
  ),
};
