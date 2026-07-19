import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listMock = vi.fn();
const updateMock = vi.fn();
const createMock = vi.fn();
const removeMock = vi.fn();
const createLocaleMock = vi.fn();

vi.mock('@TheY2T/tmr-web-acl/i18n-api', () => ({
  listLocales: () =>
    Promise.resolve([
      { code: 'en', label: 'English' },
      { code: 'zh-Hans', label: '中文' },
    ]),
  localeAdminApi: {
    list: (...args: unknown[]) => listMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
    restore: vi.fn(),
    revisions: vi.fn(),
    restoreRevision: vi.fn(),
    publish: vi.fn(),
    createLocale: (...args: unknown[]) => createLocaleMock(...args),
    importStrings: vi.fn(),
  },
}));

import AdminLocaleManager from './AdminLocaleManager';

function row(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'id',
    locale: 'en',
    key: 'nav.catalogue',
    draftValue: 'Catalogue',
    publishedValue: 'Catalogue',
    status: 'published',
    seeded: true,
    deleted: false,
    updatedAt: '2026-07-18T00:00:00.000Z',
    ...over,
  };
}

describe('AdminLocaleManager island', () => {
  beforeEach(() => {
    listMock.mockReset();
    updateMock.mockReset().mockResolvedValue(row());
    createMock.mockReset().mockResolvedValue(row());
    removeMock.mockReset().mockResolvedValue(row({ deleted: true }));
    createLocaleMock.mockReset().mockResolvedValue({ code: 'fr', label: 'Français' });
  });

  it('folds a key’s locale rows into one grouped row with locale badges', async () => {
    listMock.mockResolvedValue([
      row({ id: 'en', locale: 'en' }),
      row({ id: 'zh', locale: 'zh-Hans', draftValue: '浏览曲库', publishedValue: '浏览曲库' }),
    ]);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    const bodyRows = document.querySelectorAll('table tbody tr');
    expect(bodyRows).toHaveLength(1); // one row per key, not per locale
    const only = within(bodyRows[0] as HTMLElement);
    expect(only.getByText('en')).toBeInTheDocument();
    expect(only.getByText('zh-Hans')).toBeInTheDocument();
  });

  it('edits a locale value in the per-key modal and saves it as an update', async () => {
    listMock.mockResolvedValue([
      row({ id: 'en', locale: 'en' }),
      row({ id: 'zh', locale: 'zh-Hans', draftValue: '浏览曲库', publishedValue: '浏览曲库' }),
    ]);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    // Both locales are listed in the modal (by their registry labels).
    expect(within(dialog).getByText('English')).toBeInTheDocument();
    expect(within(dialog).getByText('中文')).toBeInTheDocument();

    const editor = within(dialog).getByDisplayValue('Catalogue');
    fireEvent.change(editor, { target: { value: 'Browse the catalogue' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith('en', 'Browse the catalogue'));
    // The untouched zh row is not re-saved.
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it('“Show deleted” with no deleted items shows the no-deleted message', async () => {
    listMock.mockResolvedValue([row()]);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(screen.queryByText('nav.catalogue')).not.toBeInTheDocument());
    expect(screen.getByText('No deleted items.')).toBeInTheDocument();
  });

  it('filters keys client-side by the search box', async () => {
    listMock.mockResolvedValue([
      row({ id: 'a', key: 'nav.catalogue' }),
      row({ id: 'b', key: 'nav.drills', draftValue: 'Drills', publishedValue: 'Drills' }),
    ]);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    fireEvent.change(screen.getByPlaceholderText('Search by key or value…'), {
      target: { value: 'drills' },
    });
    await waitFor(() => expect(screen.queryByText('nav.catalogue')).not.toBeInTheDocument());
    expect(screen.getByText('nav.drills')).toBeInTheDocument();
  });

  it('registers a new locale from the Add locale dialog', async () => {
    listMock.mockResolvedValue([row()]);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    fireEvent.click(screen.getByRole('button', { name: 'Add locale' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('e.g. fr, es, ja'), {
      target: { value: 'fr' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('Français'), {
      target: { value: 'Français' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(createLocaleMock).toHaveBeenCalledWith({ code: 'fr', label: 'Français' }),
    );
  });

  it('Add string requires a value for every locale and creates the key across all', async () => {
    listMock.mockResolvedValue([row()]);
    render(<AdminLocaleManager locale="en" />);
    await screen.findByText('nav.catalogue');

    fireEvent.click(screen.getByRole('button', { name: 'Add string' }));
    const dialog = await screen.findByRole('dialog');
    const create = within(dialog).getByRole('button', { name: 'Create' });

    fireEvent.change(within(dialog).getByPlaceholderText('domain.thing'), {
      target: { value: 'foo.bar' },
    });
    // One locale filled, the other blank → still disabled (all locales required).
    const textareas = within(dialog)
      .getAllByRole('textbox')
      .filter((el) => el.tagName === 'TEXTAREA');
    expect(textareas).toHaveLength(2);
    fireEvent.change(textareas[0], { target: { value: 'Foo' } });
    expect(create).toBeDisabled();

    fireEvent.change(textareas[1], { target: { value: '福' } });
    expect(create).toBeEnabled();

    fireEvent.click(create);
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(2));
    expect(createMock).toHaveBeenCalledWith({ locale: 'en', key: 'foo.bar', value: 'Foo' });
    expect(createMock).toHaveBeenCalledWith({ locale: 'zh-Hans', key: 'foo.bar', value: '福' });
  });
});
