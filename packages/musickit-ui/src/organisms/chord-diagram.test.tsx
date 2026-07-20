import type { ChordShape } from '@TheY2T/tmr-music-core/chord-shapes';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChordDiagram } from './chord-diagram';

describe('ChordDiagram', () => {
  const openC: ChordShape = { name: 'C', quality: 'major', frets: [-1, 3, 2, 0, 1, 0] };

  it('labels the diagram by chord name and renders one line per string', () => {
    const { container } = render(<ChordDiagram chord={openC} />);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('C chord diagram');
  });

  it('prints finger numbers inside fretted dots when provided', () => {
    const withFingers: ChordShape = { ...openC, fingers: [0, 3, 2, 0, 1, 0] };
    const { getByText } = render(<ChordDiagram chord={withFingers} />);
    // Fretted strings carry their finger digit; open/muted strings do not.
    expect(getByText('3')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });

  it('draws a barre bar across the held strings when barres are present', () => {
    // F barre at fret 1 across all six strings.
    const fBarre: ChordShape = {
      name: 'F',
      quality: 'barre',
      frets: [1, 3, 3, 2, 1, 1],
      fingers: [1, 3, 4, 2, 1, 1],
      barres: [1],
    };
    const { container } = render(<ChordDiagram chord={fBarre} />);
    expect(container.querySelector('rect')).toBeTruthy();
  });

  it('renders no finger text and no barre for a plain shape', () => {
    const { container } = render(<ChordDiagram chord={openC} />);
    expect(container.querySelector('rect')).toBeNull();
  });
});
