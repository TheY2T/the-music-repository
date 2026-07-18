import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AnswerKeyboard from './AnswerKeyboard';

describe('AnswerKeyboard (play-instrument capture)', () => {
  it('renders one octave (C4→C5) of keys', () => {
    render(<AnswerKeyboard onNote={vi.fn()} />);
    // 8 white keys (C D E F G A B C) + 5 black keys = 13 keys.
    expect(screen.getAllByRole('button')).toHaveLength(13);
  });

  it('reports the MIDI note of a pressed key (explore — does not lock)', async () => {
    const onNote = vi.fn();
    render(<AnswerKeyboard onNote={onNote} />);
    // The first key is C4 (MIDI 60). pointerDown drives the capture.
    const c4 = screen.getAllByRole('button')[0];
    await userEvent.pointer({ keys: '[MouseLeft>]', target: c4 });
    expect(onNote).toHaveBeenCalledWith(60);
  });

  it('marks the selected key while exploring', () => {
    render(<AnswerKeyboard onNote={vi.fn()} selectedMidi={60} />);
    const c4 = screen.getAllByRole('button')[0];
    expect(c4).toHaveAttribute('aria-pressed', 'true');
    expect(c4.className).toContain('bg-accent');
  });

  it('reveals the correct key on answer and the wrong choice red', () => {
    // Answered E (64) but the correct pitch class was F (5) → F key success, E key destructive.
    render(<AnswerKeyboard onNote={vi.fn()} selectedMidi={64} correctPc={5} answered disabled />);
    const e4 = screen.getByRole('button', { name: 'E' });
    const f4 = screen.getByRole('button', { name: 'F' });
    expect(e4.className).toContain('destructive');
    expect(f4.className).toContain('success');
  });

  it('is inert when disabled', async () => {
    const onNote = vi.fn();
    render(<AnswerKeyboard onNote={onNote} disabled />);
    await userEvent.pointer({ keys: '[MouseLeft>]', target: screen.getAllByRole('button')[0] });
    expect(onNote).not.toHaveBeenCalled();
  });
});
