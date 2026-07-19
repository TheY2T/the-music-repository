import { describe, expect, it } from 'vitest';
import { applyCollectionOverlay, type Collection } from './collection';

function baseCollection(over: Partial<Collection> = {}): Collection {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'col-1',
    slug: 'ii-v-i',
    title: 'ii–V–I Mastery',
    summary: 'The essential jazz cadence',
    bodyMdx: 'English intro',
    kind: 'course',
    visibility: 'public',
    status: 'published',
    curationType: 'editorial',
    ownerId: null,
    heroImageKey: null,
    accent: null,
    featured: false,
    difficultyMin: null,
    difficultyMax: null,
    estMinutes: null,
    curatorName: 'Jo',
    curatorBio: 'A pianist',
    outcomes: ['Hear the cadence', 'Play it in all keys'],
    facets: null,
    tags: null,
    popularity: 0,
    createdAt: now,
    updatedAt: now,
    itemSlugs: ['autumn-leaves'],
    sections: [
      { id: 'sec-1', title: 'Foundations', description: 'Start here', position: 0, itemSlugs: [] },
    ],
    items: [
      {
        contentSlug: 'autumn-leaves',
        sectionId: 'sec-1',
        curatorNote: 'A classic',
        focusSkills: null,
      },
    ],
    ...over,
  };
}

describe('applyCollectionOverlay', () => {
  it('returns the same collection for an empty overlay (no-op)', () => {
    const collection = baseCollection();
    expect(applyCollectionOverlay(collection, {})).toBe(collection);
  });

  it('overlays top-level fields and leaves absent ones at base', () => {
    const result = applyCollectionOverlay(baseCollection(), {
      title: 'ii–V–I 精通',
      curatorBio: '一位钢琴家',
    });
    expect(result.title).toBe('ii–V–I 精通');
    expect(result.curatorBio).toBe('一位钢琴家');
    expect(result.summary).toBe('The essential jazz cadence');
  });

  it('overlays a section title/description by id', () => {
    const result = applyCollectionOverlay(baseCollection(), {
      'section.sec-1.title': '基础',
    });
    expect(result.sections[0].title).toBe('基础');
    expect(result.sections[0].description).toBe('Start here'); // untranslated → base
  });

  it('overlays outcomes by index without dropping untranslated lines', () => {
    const result = applyCollectionOverlay(baseCollection(), { 'outcome.1': '在所有调上演奏' });
    expect(result.outcomes).toEqual(['Hear the cadence', '在所有调上演奏']);
  });

  it('overlays a per-item curator note by content slug', () => {
    const result = applyCollectionOverlay(baseCollection(), {
      'item.autumn-leaves.curatorNote': '经典',
    });
    expect(result.items[0].curatorNote).toBe('经典');
  });

  it('does not mutate the input collection', () => {
    const collection = baseCollection();
    applyCollectionOverlay(collection, {
      title: 'x',
      'section.sec-1.title': 'y',
      'outcome.0': 'z',
      'item.autumn-leaves.curatorNote': 'w',
    });
    expect(collection.title).toBe('ii–V–I Mastery');
    expect(collection.sections[0].title).toBe('Foundations');
    expect(collection.outcomes?.[0]).toBe('Hear the cadence');
    expect(collection.items[0].curatorNote).toBe('A classic');
  });
});
