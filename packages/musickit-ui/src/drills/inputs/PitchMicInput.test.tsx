import type { DrillItem } from '@TheY2T/tmr-music-core/drills/drill-types';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PitchMicInput from './PitchMicInput';

const item: DrillItem<string> = {
  card: '7',
  modality: 'pitch-mic',
  level: 'intermediate',
  presentation: { kind: 'audio', notes: [{ midi: 57, atMs: 0, durationMs: 900 }] },
  expected: '4',
  answerLabel: 'C♯',
  instruction: { key: 'drill.singIntervalAbove', params: { interval: 'Perfect 5th' } },
};

function setMic(available: boolean) {
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: available ? { getUserMedia: vi.fn() } : undefined,
  });
}
afterEach(() => setMic(false));

describe('PitchMicInput', () => {
  it('offers the Start-singing control (with the instruction) when a mic is available', () => {
    setMic(true);
    render(<PitchMicInput item={item} answered={null} onAnswer={vi.fn()} locale="en" />);
    expect(screen.getByRole('button', { name: /Start singing/ })).toBeInTheDocument();
    expect(screen.getByText(/Perfect 5th/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use the keyboard instead/ })).toBeInTheDocument();
  });

  it('falls back to the keyboard when no mic is available (always answerable)', () => {
    setMic(false);
    render(<PitchMicInput item={item} answered={null} onAnswer={vi.fn()} locale="en" />);
    expect(screen.queryByRole('button', { name: /Start singing/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/ })).toBeInTheDocument();
  });
});
