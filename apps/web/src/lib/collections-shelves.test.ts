import { describe, expect, it } from 'vitest';
import {
  buildCollectionShelves,
  type CollectionHubFacets,
  collectionFiltersToParams,
} from './collections-shelves';

function bucket(value: string, count = 1, label = value) {
  return { value, label, count };
}

const FACETS: CollectionHubFacets = {
  kinds: [bucket('path', 9, 'Path'), bucket('course', 8, 'Course')],
  eras: [bucket('Modern', 4), bucket('Classical', 3)],
  instruments: [bucket('guitar', 5, 'Guitar'), bucket('ukulele', 2, 'Ukulele')],
  techniques: [bucket('scales', 3, 'Scales')],
  difficulties: [bucket('2', 6)],
};

describe('buildCollectionShelves', () => {
  it('maps the kind axis onto the kind filter', () => {
    const shelves = buildCollectionShelves('kind', FACETS);
    expect(shelves.map((s) => s.title)).toEqual(['Path', 'Course']);
    expect(shelves[0].filters).toEqual({ kind: 'path' });
  });

  it('uses the era display value for the era axis', () => {
    const shelves = buildCollectionShelves('era', FACETS);
    expect(shelves.map((s) => s.filters.era?.[0])).toEqual(['Modern', 'Classical']);
  });

  it('maps the instrument axis onto the instrument filter', () => {
    const shelves = buildCollectionShelves('instrument', FACETS);
    expect(shelves.map((s) => s.filters.instrument?.[0])).toEqual(['guitar', 'ukulele']);
  });

  it('returns an empty list when the axis has no facets', () => {
    expect(buildCollectionShelves('era', undefined)).toEqual([]);
  });
});

describe('collectionFiltersToParams', () => {
  it('normalizes filters into search params', () => {
    const params = collectionFiltersToParams({ kind: 'path', era: ['Modern'] });
    expect(params.kind).toBe('path');
    expect(params.era).toEqual(['Modern']);
    expect(params.instrument).toEqual([]);
    expect(params.q).toBeUndefined();
  });
});
