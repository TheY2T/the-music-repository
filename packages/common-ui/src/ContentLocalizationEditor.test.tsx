import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsertMock = vi.fn();
const publishMock = vi.fn();
const listTranslationsMock = vi.fn();
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
  getTranslationTarget: (...a: unknown[]) => getTargetMock(...a),
  contentTranslationApi: {
    list: (...a: unknown[]) => listTranslationsMock(...a),
    upsert: (...a: unknown[]) => upsertMock(...a),
    publish: (...a: unknown[]) => publishMock(...a),
  },
}));

import ContentLocalizationEditor from './ContentLocalizationEditor';

describe('ContentLocalizationEditor', () => {
  beforeEach(() => {
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

  it('shows the base fields + a locale tab and saves + publishes a translated field', async () => {
    render(
      <ContentLocalizationEditor
        locale="en"
        entityType="content"
        slug="12-bar-blues-in-a"
        blockEditor={false}
      />,
    );
    // English reference shown once the entity + locales load (no separate doc head — the host editor owns it).
    await screen.findByText('A blues');
    // A tab for the one target (non-en) locale.
    expect(screen.getByRole('tab', { name: '中文' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A调12小节布鲁斯' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save & publish' }));

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
