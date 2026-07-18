import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import OptionGrid from './OptionGrid';

const OPTIONS = [
  { value: 'Major 3rd', label: 'Major 3rd' },
  { value: 'Perfect 5th', label: 'Perfect 5th' },
  { value: 'Minor 3rd', label: 'Minor 3rd' },
];

describe('OptionGrid (objective answer surface)', () => {
  it('reports the chosen value and only once (locks after answering)', async () => {
    const onAnswer = vi.fn();
    const { rerender } = render(
      <OptionGrid options={OPTIONS} expected="Major 3rd" answered={null} onAnswer={onAnswer} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Perfect 5th' }));
    expect(onAnswer).toHaveBeenCalledWith('Perfect 5th');

    // Once answered, every option is disabled — no further submissions.
    rerender(
      <OptionGrid
        options={OPTIONS}
        expected="Major 3rd"
        answered="Perfect 5th"
        onAnswer={onAnswer}
      />,
    );
    for (const opt of OPTIONS) {
      expect(screen.getByRole('button', { name: opt.label })).toBeDisabled();
    }
  });

  it('marks the correct option success and a wrong choice destructive', () => {
    render(
      <OptionGrid
        options={OPTIONS}
        expected="Major 3rd"
        answered="Perfect 5th"
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Major 3rd' }).className).toContain('text-success');
    expect(screen.getByRole('button', { name: 'Perfect 5th' }).className).toContain(
      'text-destructive',
    );
    expect(screen.getByRole('button', { name: 'Minor 3rd' }).className).not.toContain(
      'text-success',
    );
  });
});
