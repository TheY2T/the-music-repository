import { beforeEach, describe, expect, it } from 'vitest';
import { createBrowseHistory } from './browse-history';

interface TestState {
  q: string;
  tags: string[];
  page: number;
}

const store = createBrowseHistory<TestState>('test-ns');
const state: TestState = { q: 'bach', tags: ['classical'], page: 3 };

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe('browse state', () => {
  it('round-trips through sessionStorage', () => {
    store.saveState(state);
    expect(store.loadState()).toEqual(state);
  });

  it('returns null when nothing is saved', () => {
    expect(store.loadState()).toBeNull();
  });

  it('namespaces its keys', () => {
    store.saveState(state);
    expect(sessionStorage.getItem('tmr.test-ns.browseState')).toContain('bach');
  });
});

describe('last-selected slug', () => {
  it('is read exactly once (take clears it)', () => {
    store.setLastSelected('moonlight-sonata');
    expect(store.takeLastSelected()).toBe('moonlight-sonata');
    // Consumed — a fresh visit must not re-trigger the scroll/highlight.
    expect(store.takeLastSelected()).toBeNull();
  });

  it('returns null when never set', () => {
    expect(store.takeLastSelected()).toBeNull();
  });
});

describe('recents', () => {
  const item = (slug: string) => ({ slug, title: slug });

  it('keeps newest first', () => {
    store.pushRecent(item('a'));
    store.pushRecent(item('b'));
    expect(store.getRecents().map((r) => r.slug)).toEqual(['b', 'a']);
  });

  it('dedupes by slug and moves a repeat to the front', () => {
    store.pushRecent(item('a'));
    store.pushRecent(item('b'));
    store.pushRecent(item('a'));
    expect(store.getRecents().map((r) => r.slug)).toEqual(['a', 'b']);
  });

  it('caps the list at 12 entries', () => {
    for (let i = 0; i < 20; i += 1) store.pushRecent(item(`s${i}`));
    const recents = store.getRecents();
    expect(recents).toHaveLength(12);
    expect(recents[0].slug).toBe('s19'); // most recent first
  });

  it('returns [] for missing or malformed storage', () => {
    expect(store.getRecents()).toEqual([]);
    localStorage.setItem('tmr.test-ns.recents', 'not json');
    expect(store.getRecents()).toEqual([]);
  });

  it('clears the list', () => {
    store.pushRecent(item('a'));
    store.clearRecents();
    expect(store.getRecents()).toEqual([]);
  });
});
