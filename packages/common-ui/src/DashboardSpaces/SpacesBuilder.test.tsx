import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// `vi.hoisted` so the mock factory (hoisted above imports) can reference the spy safely.
const { save } = vi.hoisted(() => ({
  save: vi.fn(async (_input: unknown): Promise<null> => null),
}));

// Start from a note-only space so no audio/WebGL tool widgets mount in the unit optimizer.
vi.mock('@TheY2T/tmr-web-acl/dashboard-spaces-api', () => ({
  getDashboardSpaces: async () => ({
    activeSpaceId: 's1',
    updatedAt: '',
    spaces: [
      {
        id: 's1',
        name: 'Test space',
        widgets: [{ id: 'w1', type: 'note', x: 0, y: 0, w: 3, h: 3, config: { text: 'hi' } }],
      },
    ],
  }),
  saveDashboardSpaces: (input: unknown) => save(input),
}));

import SpacesBuilder from './SpacesBuilder';

describe('SpacesBuilder island', () => {
  it('edits a note and autosaves the change', async () => {
    const user = userEvent.setup();
    render(<SpacesBuilder locale="en" />);

    // Loads the saved space read-only.
    await waitFor(() => expect(screen.getByText('hi')).toBeInTheDocument());

    // Enter edit mode → the note becomes an editable textarea (targeted by its placeholder, so it
    // isn't confused with the space-name input).
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getByPlaceholderText(/Write a note/);
    await user.type(textarea, ' there');

    // The debounced upsert fires with the updated note text.
    await waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 2000 });
    const lastCall = save.mock.calls.at(-1)?.[0] as {
      spaces: { widgets: { config: { text?: string } }[] }[];
    };
    expect(lastCall.spaces[0]?.widgets[0]?.config.text).toContain('there');
  });

  it('adds a widget from the palette', async () => {
    save.mockClear();
    const user = userEvent.setup();
    render(<SpacesBuilder locale="en" />);
    await waitFor(() => expect(screen.getByText('hi')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Add widget' }));
    // The palette lists widget types as buttons, including the coursework + gamification widgets.
    expect(screen.getByRole('button', { name: 'Courses' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Achievements' })).toBeInTheDocument();
    // The "Note" button appends a second note widget.
    await user.click(screen.getByRole('button', { name: 'Note' }));

    await waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 2000 });
    const lastCall = save.mock.calls.at(-1)?.[0] as { spaces: { widgets: unknown[] }[] };
    expect(lastCall.spaces[0]?.widgets.length).toBe(2);
  });

  it('creates a new space from a template via the picker', async () => {
    save.mockClear();
    const user = userEvent.setup();
    render(<SpacesBuilder locale="en" />);
    await waitFor(() => expect(screen.getByText('hi')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'New space' }));
    // Pick the empty "Blank" template so no tool/coursework widgets mount in the unit optimizer.
    await user.click(await screen.findByRole('menuitem', { name: 'Blank' }));

    await waitFor(() => expect(save).toHaveBeenCalled(), { timeout: 2000 });
    const lastCall = save.mock.calls.at(-1)?.[0] as { spaces: unknown[] };
    expect(lastCall.spaces.length).toBe(2);
  });
});
