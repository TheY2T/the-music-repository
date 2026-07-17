import { describe, expect, it } from 'vitest';
import {
  type ContentItem,
  entitledRank,
  normalizeKey,
  slugToLabel,
  tierRank,
  toContentSummaryView,
  toLockedContentDetailView,
} from './content-item';

describe('normalizeKey', () => {
  it('keeps a clean key as-is', () => {
    expect(normalizeKey('A minor')).toBe('A minor');
    expect(normalizeKey('C major')).toBe('C major');
  });

  it('strips qualifiers after a paren, comma, or semicolon', () => {
    expect(normalizeKey('B-flat major (opening), moving to E-flat major')).toBe('B-flat major');
    expect(normalizeKey('E Dorian (commonly played in A minor / D Dorian too)')).toBe('E Dorian');
    expect(normalizeKey('D major; modulates to A')).toBe('D major');
  });

  it('returns null for empty/nullish input', () => {
    expect(normalizeKey(null)).toBeNull();
    expect(normalizeKey(undefined)).toBeNull();
    expect(normalizeKey('  ')).toBeNull();
  });
});

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'id-1',
    slug: 'autumn-leaves',
    title: 'Autumn Leaves',
    summary: 'A jazz standard.',
    bodyMdx: '# body',
    type: 'song',
    visibility: 'public',
    tier: null,
    status: 'published',
    difficulty: 3,
    source: null,
    attribution: null,
    license: null,
    details: null,
    bodyDoc: null,
    createdAt: now,
    updatedAt: now,
    genres: [],
    instruments: [],
    topics: [],
    tags: [],
    media: [],
    ...overrides,
  };
}

describe('tier ranking', () => {
  it('ranks premium < pro < institution', () => {
    expect(tierRank('premium')).toBe(1);
    expect(tierRank('pro')).toBe(2);
    expect(tierRank('institution')).toBe(3);
  });

  it('defaults an unset/unknown tier to premium rank', () => {
    expect(tierRank(null)).toBe(1);
    expect(tierRank(undefined)).toBe(1);
    expect(tierRank('mystery')).toBe(1);
  });

  it("entitledRank is the highest rank among a viewer's keys (0 = none)", () => {
    expect(entitledRank([])).toBe(0);
    expect(entitledRank(['premium'])).toBe(1);
    expect(entitledRank(['premium', 'pro'])).toBe(2);
    expect(entitledRank(['unknown'])).toBe(0);
  });
});

describe('view projections', () => {
  it('slugToLabel humanizes a slug', () => {
    expect(slugToLabel('pop-rock')).toBe('Pop rock');
  });

  it('exposes tier only on premium items', () => {
    expect(toContentSummaryView(makeItem({ visibility: 'public' })).tier).toBeUndefined();
    expect(toContentSummaryView(makeItem({ visibility: 'premium', tier: null })).tier).toBe(
      'premium',
    );
    expect(toContentSummaryView(makeItem({ visibility: 'premium', tier: 'pro' })).tier).toBe('pro');
  });

  it('locked preview withholds the paywalled body + media', () => {
    const locked = toLockedContentDetailView(makeItem({ visibility: 'premium' }));
    expect(locked.locked).toBe(true);
    expect(locked.bodyMdx).toBeUndefined();
    expect(locked.media).toEqual([]);
  });
});
