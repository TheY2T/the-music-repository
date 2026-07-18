import type { DrillItem } from '@TheY2T/tmr-music-core/drills/drill-types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RhythmTapInput from './RhythmTapInput';

const item: DrillItem<string> = {
  card: 'quarters',
  modality: 'rhythm-tap',
  level: 'beginner',
  presentation: {
    kind: 'rhythm',
    pattern: Array.from({ length: 16 }, (_, i) => i % 4 === 0),
    bpm: 90,
  },
  expected: '0,1,2,3',
  answerLabel: 'Quarter notes',
  instruction: { key: 'drill.tapRhythm' },
};

async function tapPad() {
  await userEvent.pointer({ keys: '[MouseLeft>]', target: screen.getByLabelText('Tap pad') });
}

describe('RhythmTapInput', () => {
  it('renders the instruction + a tap pad, Submit disabled until a tap', () => {
    render(<RhythmTapInput item={item} answered={null} onAnswer={vi.fn()} locale="en" />);
    expect(screen.getByText(/Tap the rhythm/)).toBeInTheDocument();
    expect(screen.getByLabelText('Tap pad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('counts taps and submits beats normalized to the first tap', async () => {
    const onAnswer = vi.fn();
    render(<RhythmTapInput item={item} answered={null} onAnswer={onAnswer} locale="en" />);
    await tapPad();
    await tapPad();
    expect(screen.getByText('2 taps')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    const response = onAnswer.mock.calls[0][0] as string;
    expect(response.split(',')).toHaveLength(2);
    expect(response.startsWith('0.000')).toBe(true); // first tap anchors the downbeat
  });

  it('clears recorded taps', async () => {
    render(<RhythmTapInput item={item} answered={null} onAnswer={vi.fn()} locale="en" />);
    await tapPad();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('0 taps')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
