import { describe, expect, it } from 'vitest';
import { applyContentOverlay, type ContentItem } from './content-item';

function baseItem(over: Partial<ContentItem> = {}): ContentItem {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'id-1',
    slug: 'fur-elise',
    title: 'Für Elise',
    summary: 'A bagatelle',
    bodyMdx: 'English body',
    type: 'score',
    visibility: 'public',
    tier: null,
    status: 'published',
    difficulty: null,
    source: null,
    attribution: null,
    license: null,
    details: { key: 'A minor', composer: 'Beethoven' },
    bodyDoc: null,
    createdAt: now,
    updatedAt: now,
    genres: [],
    instruments: [],
    topics: [],
    tags: [],
    media: [],
    ...over,
  };
}

describe('applyContentOverlay', () => {
  it('returns the same item for an empty overlay (no-op)', () => {
    const item = baseItem();
    expect(applyContentOverlay(item, {})).toBe(item);
  });

  it('overlays title/summary/bodyMdx and leaves absent fields at their base value', () => {
    const result = applyContentOverlay(baseItem(), { title: '致爱丽丝', bodyMdx: '中文正文' });
    expect(result.title).toBe('致爱丽丝');
    expect(result.bodyMdx).toBe('中文正文');
    expect(result.summary).toBe('A bagatelle'); // untranslated → base
  });

  it('overlays details.<field> facts without dropping untranslated ones', () => {
    const result = applyContentOverlay(baseItem(), { 'details.composer': '贝多芬' });
    expect(result.details?.composer).toBe('贝多芬');
    expect(result.details?.key).toBe('A minor'); // untranslated fact preserved
  });

  it('does not mutate the input item', () => {
    const item = baseItem();
    applyContentOverlay(item, { title: 'x', 'details.key': 'y' });
    expect(item.title).toBe('Für Elise');
    expect(item.details?.key).toBe('A minor');
  });
});
