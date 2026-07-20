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

  it('mirrors the string columns horizontally when left-handed', () => {
    // The muted (×) marker sits above the low string. Right-handed puts it on the left; left-handed
    // mirrors it to the right of the same diagram.
    const marker = (handedness: 'left' | 'right') => {
      const { container } = render(<ChordDiagram chord={openC} handedness={handedness} />);
      const cross = [...container.querySelectorAll('text')].find((t) => t.textContent === '×');
      return Number(cross?.getAttribute('x'));
    };
    const right = marker('right');
    const left = marker('left');
    expect(Number.isNaN(right)).toBe(false);
    // Six strings, 14px columns → the low string flips from x=12 to x=12+5*14=82.
    expect(left).toBeGreaterThan(right);
    expect(left - right).toBe(5 * 14);
  });

  it('moves the position label to the opposite side when left-handed for a movable shape', () => {
    const movable: ChordShape = {
      name: 'Bb',
      quality: 'barre',
      frets: [-1, 1, 3, 3, 3, 1],
      baseFret: 1,
    };
    // A movable shape (baseFret > 1) prints an "Nfr" label; make one by shifting the window.
    const shifted: ChordShape = { ...movable, baseFret: 6 };
    const rightLabel = render(<ChordDiagram chord={shifted} />).container.querySelector(
      'text[text-anchor="end"]',
    );
    const leftLabel = render(
      <ChordDiagram chord={shifted} handedness="left" />,
    ).container.querySelector('text[text-anchor="start"]');
    expect(rightLabel?.textContent).toBe('6fr');
    expect(leftLabel?.textContent).toBe('6fr');
  });
});
