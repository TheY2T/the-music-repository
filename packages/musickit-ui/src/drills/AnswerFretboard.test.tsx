import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AnswerFretboard from './AnswerFretboard';

describe('AnswerFretboard (play-instrument capture)', () => {
  it('renders 6 strings × 13 frets of pressable positions', () => {
    render(<AnswerFretboard onNote={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(6 * 13);
  });

  it('reports the MIDI note of a pressed fret (high-E open = 64)', async () => {
    const onNote = vi.fn();
    render(<AnswerFretboard onNote={onNote} />);
    // String 1, fret 0 = high-E open = MIDI 64.
    const openHighE = screen.getByRole('button', { name: 'String 1 (E), fret 0 — E' });
    await userEvent.pointer({ keys: '[MouseLeft>]', target: openHighE });
    expect(onNote).toHaveBeenCalledWith(64);
  });

  it('lights every fret of the correct pitch class on answer', () => {
    // Correct pitch class G (7): the open G-string (string 3, fret 0) should be success-highlighted.
    render(<AnswerFretboard onNote={vi.fn()} correctPc={7} answered disabled />);
    const openG = screen.getByRole('button', { name: 'String 3 (G), fret 0 — G' });
    expect(openG.className).toContain('success');
  });

  it('is inert when disabled', async () => {
    const onNote = vi.fn();
    render(<AnswerFretboard onNote={onNote} disabled />);
    await userEvent.pointer({ keys: '[MouseLeft>]', target: screen.getAllByRole('button')[0] });
    expect(onNote).not.toHaveBeenCalled();
  });
});
