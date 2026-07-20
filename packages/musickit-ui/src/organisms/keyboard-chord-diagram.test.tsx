import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyboardChordDiagram } from './keyboard-chord-diagram';

describe('KeyboardChordDiagram', () => {
  it('describes the sounded notes and inversion in its aria-label', () => {
    const { container } = render(
      <KeyboardChordDiagram midis={[60, 64, 67]} label="Root position" />,
    );
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Keyboard chord diagram: C E G (Root position)',
    );
  });

  it('spells highlighted notes with flats when asked', () => {
    const { getByText } = render(<KeyboardChordDiagram midis={[63]} flats />);
    expect(getByText('E♭')).toBeTruthy();
  });

  it('renders a caption label when provided', () => {
    const { getByText } = render(
      <KeyboardChordDiagram midis={[60, 64, 67]} label="1st inversion" />,
    );
    expect(getByText('1st inversion')).toBeTruthy();
  });

  it('renders whole white octaves (C..B) around the voicing', () => {
    // C4–G4 spans one octave C4..B4 → 7 white keys.
    const { container } = render(<KeyboardChordDiagram midis={[60, 64, 67]} />);
    const whiteKeys = container.querySelectorAll('rect[height="54"]');
    expect(whiteKeys).toHaveLength(7);
  });
});
