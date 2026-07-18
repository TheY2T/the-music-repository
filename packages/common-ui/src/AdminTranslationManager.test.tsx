import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsertMock = vi.fn();
const publishMock = vi.fn();
const listTranslationsMock = vi.fn();
const listTargetsMock = vi.fn();
const getTargetMock = vi.fn();

vi.mock('@TheY2T/tmr-web-data/i18n-api', () => ({
  listLocales: () =>
    Promise.resolve([
      { code: 'en', label: 'English' },
      { code: 'zh-Hans', label: '中文' },
    ]),
}));

vi.mock('@TheY2T/tmr-web-data/content-translations-api', () => ({
  TRANSLATABLE_FIELDS: {
    content: ['title', 'summary', 'bodyMdx'],
    collection: ['title', 'summary', 'bodyMdx', 'curatorBio'],
    help: ['term', 'body'],
  },
  listTranslationTargets: (...a: unknown[]) => listTargetsMock(...a),
  getTranslationTarget: (...a: unknown[]) => getTargetMock(...a),
  contentTranslationApi: {
    list: (...a: unknown[]) => listTranslationsMock(...a),
    upsert: (...a: unknown[]) => upsertMock(...a),
    publish: (...a: unknown[]) => publishMock(...a),
    remove: vi.fn(),
    restore: vi.fn(),
  },
}));

import AdminTranslationManager from './AdminTranslationManager';

describe('AdminTranslationManager island', () => {
  beforeEach(() => {
    listTargetsMock.mockReset().mockResolvedValue([
      { slug: '12-bar-blues-in-a', title: '12-Bar Blues in A' },
      { slug: 'st-louis-blues', title: 'St. Louis Blues' },
    ]);
    getTargetMock.mockReset().mockResolvedValue({
      entityType: 'content',
      entityId: 'c-1',
      slug: '12-bar-blues-in-a',
      title: '12-Bar Blues in A',
      fields: { title: '12-Bar Blues in A', summary: 'A blues', bodyMdx: 'Body' },
    });
    listTranslationsMock.mockReset().mockResolvedValue([]);
    upsertMock.mockReset().mockResolvedValue({});
    publishMock.mockReset().mockResolvedValue(1);
  });

  it('lists translatable entities and filters by search', async () => {
    render(<AdminTranslationManager locale="en" />);
    await screen.findByText('12-Bar Blues in A');
    expect(screen.getByText('St. Louis Blues')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search by title or slug…'), {
      target: { value: 'louis' },
    });
    await waitFor(() => expect(screen.queryByText('12-Bar Blues in A')).not.toBeInTheDocument());
    expect(screen.getByText('St. Louis Blues')).toBeInTheDocument();
  });

  it('translates a field into a locale and saves + publishes the entity', async () => {
    render(<AdminTranslationManager locale="en" />);
    await screen.findByText('12-Bar Blues in A');

    fireEvent.click(screen.getAllByRole('button', { name: 'Translate' })[0]);
    const dialog = await screen.findByRole('dialog');
    // Base English value shown for reference; one editor per target (non-en) locale.
    await within(dialog).findByText('A blues');
    const editors = within(dialog).getAllByRole('textbox');
    fireEvent.change(editors[0], { target: { value: 'A调12小节布鲁斯' } });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save & publish' }));

    await waitFor(() =>
      expect(upsertMock).toHaveBeenCalledWith({
        entityType: 'content',
        entityId: 'c-1',
        locale: 'zh-Hans',
        field: 'title',
        value: 'A调12小节布鲁斯',
      }),
    );
    expect(publishMock).toHaveBeenCalledWith('content', 'c-1');
  });
});
