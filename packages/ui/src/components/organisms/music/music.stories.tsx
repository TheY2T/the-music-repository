import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChordDiagram, GUITAR_CHORDS } from './chord-diagram';
import { StaffSequence } from './StaffSequence';

const meta: Meta = {
  title: 'Music',
};
export default meta;

type Story = StoryObj;

export const Staff: Story = {
  render: () => (
    <StaffSequence
      showLabels
      activeIndex={2}
      notes={[
        { step: 0, label: 'E4', beats: 1 },
        { step: 1, label: 'F4', beats: 0.5 },
        { step: 2, label: 'G4', beats: 2 },
        { step: 4, label: 'B4', accidental: '♭', beats: 1 },
        { step: 0, label: 'rest', rest: true, beats: 1 },
      ]}
    />
  ),
};

export const ChordDiagrams: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {GUITAR_CHORDS.slice(0, 5).map((chord) => (
        <div key={chord.name} className="flex flex-col items-center gap-1">
          <span className="font-semibold">{chord.name}</span>
          <ChordDiagram chord={chord} />
        </div>
      ))}
    </div>
  ),
};
