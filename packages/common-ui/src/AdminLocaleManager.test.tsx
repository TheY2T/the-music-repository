import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listMock = vi.fn();
const removeMock = vi.fn();

vi.mock('@TheY2T/tmr-web-data/i18n-api', () => ({
  localeAdminApi: {
    list: (...args: unknown[]) => listMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
    create: vi.fn(),
    update: vi.fn(),
    restore: vi.fn(),
    revisions: vi.fn(),
    restoreRevision: vi.fn(),
    publish: vi.fn(),
  },
}));

import AdminLocaleManager from './AdminLocaleManager';

const ROW = {
  id: 'id-1',
  locale: 'en',
  key: 'nav.catalogue',
  draftValue: 'Catalogue',
  publishedValue: 'Catalogue',
  status: 'published',
  seeded: true,
  deleted: false,
  updatedAt: '2026-07-18T00:00:00.000Z',
};

describe('AdminLocaleManager island', () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue([ROW]);
    removeMock.mockReset().mockResolvedValue({ ...ROW, deleted: true });
  });

  it('renders loaded strings by key', async () => {
    render(<AdminLocaleManager locale="en" />);
    expect(await screen.findByText('nav.catalogue')).toBeInTheDocument();
  });

  it('gates delete behind typing the exact key', async () => {
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // The confirm button is disabled until the typed value matches the key.
    const confirm = await screen.findByRole('button', { name: 'Delete string' });
    expect(confirm).toBeDisabled();

    const input = screen.getByPlaceholderText('nav.catalogue');
    fireEvent.change(input, { target: { value: 'nav.wrong' } });
    expect(confirm).toBeDisabled();

    fireEvent.change(input, { target: { value: 'nav.catalogue' } });
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    await waitFor(() => expect(removeMock).toHaveBeenCalledWith('id-1'));
  });
});
