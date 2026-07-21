import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WidgetPickerDialog from './WidgetPickerDialog';

describe('WidgetPickerDialog', () => {
  it('renders nothing while closed', () => {
    render(<WidgetPickerDialog locale="en" open={false} onOpenChange={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists widgets across categories and adds the picked one', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onOpenChange = vi.fn();
    render(<WidgetPickerDialog locale="en" open onOpenChange={onOpenChange} onAdd={onAdd} />);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /Metronome/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Piano keyboard/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Achievements/ })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /Piano keyboard/ }));
    expect(onAdd).toHaveBeenCalledWith('keyboard');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('filters by search text over titles and descriptions', async () => {
    const user = userEvent.setup();
    render(<WidgetPickerDialog locale="en" open onOpenChange={vi.fn()} onAdd={vi.fn()} />);
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByRole('searchbox'), 'tuning');
    expect(within(dialog).getByRole('button', { name: /Tuning reference/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /Metronome/ })).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<WidgetPickerDialog locale="en" open onOpenChange={vi.fn()} onAdd={vi.fn()} />);
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByRole('searchbox'), 'zzzznotawidget');
    expect(within(dialog).getByText('No widgets match your search.')).toBeInTheDocument();
  });

  it('narrows to a single category via the tabs', async () => {
    const user = userEvent.setup();
    render(<WidgetPickerDialog locale="en" open onOpenChange={vi.fn()} onAdd={vi.fn()} />);
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByRole('tab', { name: 'Tools' }));
    expect(within(dialog).getByRole('button', { name: /Metronome/ })).toBeInTheDocument();
    // Progress-category widgets are hidden while the Tools tab is active.
    await waitFor(() =>
      expect(
        within(dialog).queryByRole('button', { name: /Achievements/ }),
      ).not.toBeInTheDocument(),
    );
  });
});
