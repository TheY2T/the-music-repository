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

  it('paginates a large set (page size 10) and navigates pages', async () => {
    const rows = Array.from({ length: 23 }, (_, i) => ({
      ...ROW,
      id: `id-${i}`,
      key: `k.${String(i).padStart(2, '0')}`,
    }));
    listMock.mockResolvedValue(rows);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('k.00');

    // Default page size 50 → all 23 visible on one page (no pager).
    expect(screen.getByText('k.22')).toBeInTheDocument();

    // Switch to 10 per page → only the first 10 rows render, and a pager appears.
    fireEvent.change(screen.getByLabelText('Per page'), { target: { value: '10' } });
    await waitFor(() => expect(screen.queryByText('k.10')).not.toBeInTheDocument());
    expect(screen.getByText('k.00')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–10 of 23')).toBeInTheDocument();

    // Go to page 2 → rows 10–19 render.
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(await screen.findByText('k.10')).toBeInTheDocument();
    expect(screen.queryByText('k.00')).not.toBeInTheDocument();
  });

  it('filters rows client-side by the search box', async () => {
    listMock.mockResolvedValue([
      { ...ROW, id: 'a', key: 'nav.catalogue', draftValue: 'Catalogue' },
      { ...ROW, id: 'b', key: 'nav.drills', draftValue: 'Drills' },
    ]);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    fireEvent.change(screen.getByPlaceholderText('Search by key or value…'), {
      target: { value: 'drills' },
    });
    await waitFor(() => expect(screen.queryByText('nav.catalogue')).not.toBeInTheDocument());
    expect(screen.getByText('nav.drills')).toBeInTheDocument();
  });
});
