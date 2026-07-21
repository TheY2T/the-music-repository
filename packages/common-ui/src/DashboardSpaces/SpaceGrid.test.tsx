import type { DashboardSpace } from '@TheY2T/tmr-web-acl/dto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SpaceGrid from './SpaceGrid';

// A note-only space keeps the audio/WebGL tool widgets (lazy) out of the unit optimizer.
const space: DashboardSpace = {
  id: 's1',
  name: 'Test space',
  widgets: [
    { id: 'w1', type: 'note', x: 0, y: 0, w: 3, h: 3, config: { text: 'practice scales' } },
  ],
};

describe('SpaceGrid', () => {
  it('renders a widget card read-only in view mode', () => {
    render(<SpaceGrid space={space} editMode={false} locale="en" />);
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('practice scales')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove widget' })).not.toBeInTheDocument();
  });

  it('offers editing controls in edit mode (note textarea + remove)', async () => {
    const user = userEvent.setup();
    const onRemoveWidget = vi.fn();
    const onNoteChange = vi.fn();
    render(
      <SpaceGrid
        space={space}
        editMode
        locale="en"
        onRemoveWidget={onRemoveWidget}
        onNoteChange={onNoteChange}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('practice scales');

    await user.type(screen.getByRole('textbox'), '!');
    expect(onNoteChange).toHaveBeenCalledWith('w1', expect.stringContaining('!'));

    await user.click(screen.getByRole('button', { name: 'Remove widget' }));
    expect(onRemoveWidget).toHaveBeenCalledWith('w1');
  });

  it('shows an empty-state prompt for a space with no widgets', () => {
    render(<SpaceGrid space={{ ...space, widgets: [] }} editMode locale="en" />);
    expect(screen.getByText(/This space is empty/)).toBeInTheDocument();
  });

  it('toggles per-widget horizontal scrolling from the header button', async () => {
    const user = userEvent.setup();
    const onToggleHScroll = vi.fn();
    const { rerender } = render(
      <SpaceGrid space={space} editMode={false} locale="en" onToggleHScroll={onToggleHScroll} />,
    );

    // Off by default: the body clips horizontal overflow, and the toggle isn't pressed.
    const toggle = screen.getByRole('button', { name: 'Toggle horizontal scrolling' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('practice scales').closest('.overflow-x-hidden')).not.toBeNull();

    await user.click(toggle);
    expect(onToggleHScroll).toHaveBeenCalledWith('w1', true);

    // With the config flag on, the body scrolls horizontally and the toggle reads pressed.
    const scrolling = {
      ...space,
      widgets: [{ ...space.widgets[0], config: { ...space.widgets[0]?.config, hScroll: true } }],
    } as typeof space;
    rerender(<SpaceGrid space={scrolling} editMode={false} locale="en" />);
    expect(screen.getByRole('button', { name: 'Toggle horizontal scrolling' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('practice scales').closest('.overflow-x-auto')).not.toBeNull();
  });

  it('exposes expand-width and expand-height buttons in edit mode', async () => {
    const user = userEvent.setup();
    const onExpandWidth = vi.fn();
    const onExpandHeight = vi.fn();
    render(
      <SpaceGrid
        space={space}
        editMode
        locale="en"
        onExpandWidth={onExpandWidth}
        onExpandHeight={onExpandHeight}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Expand to fill width' }));
    expect(onExpandWidth).toHaveBeenCalledWith('w1');
    await user.click(screen.getByRole('button', { name: 'Expand to fill height' }));
    expect(onExpandHeight).toHaveBeenCalledWith('w1');
  });

  it('makes the whole card header the drag handle and opts the remove button out', () => {
    render(<SpaceGrid space={space} editMode locale="en" />);
    // The header bar carries the drag-handle class (react-grid-layout draggableHandle target).
    const header = screen.getByText('Note').closest('.widget-drag-handle');
    expect(header).not.toBeNull();
    // The remove button opts out of dragging (draggableCancel target) so clicks don't start a drag.
    expect(screen.getByRole('button', { name: 'Remove widget' })).toHaveClass('widget-no-drag');
  });
});
