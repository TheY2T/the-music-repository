import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Feed a note-only space so the test never mounts the audio/WebGL tool widgets (which hit the
// duplicate-React optimizer — those render paths are covered by the Playwright E2E smoke instead).
vi.mock('@TheY2T/tmr-web-acl/dashboard-spaces-api', () => ({
  getDashboardSpaces: async () => ({
    activeSpaceId: 's1',
    updatedAt: '2026-01-01T00:00:00.000Z',
    spaces: [
      {
        id: 's1',
        name: 'Test space',
        widgets: [
          { id: 'w1', type: 'note', x: 0, y: 0, w: 3, h: 3, config: { text: 'practice scales' } },
        ],
      },
    ],
  }),
}));

import SpaceView from './SpaceView';

describe('SpaceView island', () => {
  it('renders the active space widgets with their titles and content', async () => {
    render(<SpaceView locale="en" />);

    await waitFor(() => expect(screen.getByText('practice scales')).toBeInTheDocument());
    expect(screen.getByText('Note')).toBeInTheDocument();
  });
});
