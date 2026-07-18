import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listTargetsMock = vi.fn();

vi.mock('@TheY2T/tmr-web-data/i18n-api', () => ({
  listLocales: () =>
    Promise.resolve([
      { code: 'en', label: 'English' },
      { code: 'zh-Hans', label: '中文' },
    ]),
}));

vi.mock('@TheY2T/tmr-web-data/content-translations-api', () => ({
  listTranslationTargets: (...a: unknown[]) => listTargetsMock(...a),
}));

import ContentLocalizationList from './ContentLocalizationList';

describe('ContentLocalizationList', () => {
  beforeEach(() => {
    listTargetsMock.mockReset().mockResolvedValue([
      { slug: '12-bar-blues-in-a', title: '12-Bar Blues in A' },
      { slug: 'st-louis-blues', title: 'St. Louis Blues' },
    ]);
  });

  it('lists the type’s items, filters by search, and links each to the editor', async () => {
    render(<ContentLocalizationList locale="en" entityType="content" />);
    await screen.findByText('12-Bar Blues in A');

    // Row action is a link into the full-page editor under the catalogue segment.
    const link = screen.getAllByRole('link', { name: 'Localize' })[0];
    expect(link).toHaveAttribute('href', '/admin/localization/catalogue/12-bar-blues-in-a');

    fireEvent.change(screen.getByPlaceholderText('Search by title or slug…'), {
      target: { value: 'louis' },
    });
    await waitFor(() => expect(screen.queryByText('12-Bar Blues in A')).not.toBeInTheDocument());
    expect(screen.getByText('St. Louis Blues')).toBeInTheDocument();
  });

  it('paginates with the shared rows-per-page standard', async () => {
    const many = Array.from({ length: 23 }, (_, i) => ({
      slug: `piece-${String(i + 1).padStart(2, '0')}`,
      title: `Piece ${String(i + 1).padStart(2, '0')}`,
    }));
    listTargetsMock.mockReset().mockResolvedValue(many);

    render(<ContentLocalizationList locale="en" entityType="collection" />);
    await screen.findByText('Piece 01');
    expect(screen.getByText('Piece 10')).toBeInTheDocument();
    expect(screen.queryByText('Piece 11')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1–10 of 23')).toBeInTheDocument();

    // Collection items link under the collections segment.
    expect(screen.getAllByRole('link', { name: 'Localize' })[0]).toHaveAttribute(
      'href',
      '/admin/localization/collections/piece-01',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Piece 11');
    expect(screen.getByText('Showing 11–20 of 23')).toBeInTheDocument();
  });
});
