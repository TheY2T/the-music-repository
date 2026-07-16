import { beforeEach, describe, expect, it } from 'vitest';
import {
  type CatalogueBrowseState,
  clearRecents,
  getRecents,
  loadBrowseState,
  pushRecent,
  saveBrowseState,
  setLastSelected,
  takeLastSelected,
} from './catalogue-history';

const state: CatalogueBrowseState = {
  q: 'bach',
  genre: ['classical'],
  era: ['Baroque'],
  instrument: ['piano'],
  topic: ['sight-reading'],
  type: 'score',
  page: 3,
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe('browse state', () => {
  it('round-trips through sessionStorage', () => {
    saveBrowseState(state);
    expect(loadBrowseState()).toEqual(state);
  });

  it('returns null when nothing is saved', () => {
    expect(loadBrowseState()).toBeNull();
  });
});

describe('last-selected slug', () => {
  it('is read exactly once (take clears it)', () => {
    setLastSelected('moonlight-sonata');
    expect(takeLastSelected()).toBe('moonlight-sonata');
    // Consumed — a fresh visit must not re-trigger the scroll/highlight.
    expect(takeLastSelected()).toBeNull();
  });

  it('returns null when never set', () => {
    expect(takeLastSelected()).toBeNull();
  });
});

describe('recents', () => {
  const item = (slug: string) => ({ slug, title: slug, type: 'score' as const });

  it('keeps newest first', () => {
    pushRecent(item('a'));
    pushRecent(item('b'));
    expect(getRecents().map((r) => r.slug)).toEqual(['b', 'a']);
  });

  it('dedupes by slug and moves a repeat to the front', () => {
    pushRecent(item('a'));
    pushRecent(item('b'));
    pushRecent(item('a'));
    expect(getRecents().map((r) => r.slug)).toEqual(['a', 'b']);
  });

  it('caps the list at 12 entries', () => {
    for (let i = 0; i < 20; i += 1) pushRecent(item(`s${i}`));
    const recents = getRecents();
    expect(recents).toHaveLength(12);
    expect(recents[0].slug).toBe('s19'); // most recent first
  });

  it('returns [] for missing or malformed storage', () => {
    expect(getRecents()).toEqual([]);
    localStorage.setItem('tmr.catalogue.recents', 'not json');
    expect(getRecents()).toEqual([]);
  });

  it('clears the list', () => {
    pushRecent(item('a'));
    clearRecents();
    expect(getRecents()).toEqual([]);
  });
});
