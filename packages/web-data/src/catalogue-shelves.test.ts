import { describe, expect, it } from 'vitest';
import {
  bandCount,
  bandRange,
  buildShelves,
  filtersToParams,
  type HubFacets,
} from './catalogue-shelves';

function bucket(value: string, count = 1, label = value) {
  return { value, label, count };
}

const FACETS: HubFacets = {
  genres: [bucket('blues', 24, 'Blues'), bucket('jazz', 19, 'Jazz')],
  instruments: [bucket('guitar', 40, 'Guitar'), bucket('piano', 33, 'Piano')],
  topics: [bucket('harmony', 12, 'Harmony')],
  eras: [bucket('Baroque', 34), bucket('Modern', 40)],
  types: [bucket('lesson', 50, 'Lesson'), bucket('score', 55, 'Score')],
  difficulties: [
    bucket('1', 10),
    bucket('2', 8),
    bucket('3', 6),
    bucket('5', 4),
    bucket('8', 2),
    bucket('10', 1),
  ],
};

describe('bandRange', () => {
  it('maps a band key to its inclusive difficulty range', () => {
    expect(bandRange('beginner')).toEqual({ key: 'beginner', min: 1, max: 3 });
    expect(bandRange('advanced')).toEqual({ key: 'advanced', min: 7, max: 8 });
  });

  it('returns undefined for no/unknown band', () => {
    expect(bandRange(undefined)).toBeUndefined();
    expect(bandRange('nope')).toBeUndefined();
  });
});

describe('bandCount', () => {
  it('sums the per-grade distribution within a band', () => {
    expect(bandCount(FACETS.difficulties, { min: 1, max: 3 })).toBe(24); // 10+8+6
    expect(bandCount(FACETS.difficulties, { min: 4, max: 6 })).toBe(4); // grade 5
    expect(bandCount(FACETS.difficulties, { min: 7, max: 8 })).toBe(2); // grade 8
    expect(bandCount(FACETS.difficulties, { min: 9, max: 10 })).toBe(1); // grade 10
  });

  it('handles a missing distribution', () => {
    expect(bandCount(undefined, { min: 1, max: 3 })).toBe(0);
  });
});

describe('buildShelves', () => {
  it('derives one shelf per top facet value for a taxonomy axis', () => {
    const shelves = buildShelves('instrument', FACETS, 'en');
    expect(shelves.map((s) => s.title)).toEqual(['Guitar', 'Piano']);
    expect(shelves[0].filters).toEqual({ instrument: ['guitar'] });
  });

  it('uses the era display value (value === label) for the era axis', () => {
    const shelves = buildShelves('era', FACETS, 'en');
    expect(shelves.map((s) => s.filters.era?.[0])).toEqual(['Baroque', 'Modern']);
  });

  it('maps the format axis onto the type filter', () => {
    const shelves = buildShelves('format', FACETS, 'en');
    expect(shelves.map((s) => s.filters.type)).toEqual(['lesson', 'score']);
  });

  it('builds fixed level-band shelves regardless of facets', () => {
    const shelves = buildShelves('level', undefined, 'en');
    expect(shelves.map((s) => s.filters.level)).toEqual([
      'beginner',
      'intermediate',
      'advanced',
      'expert',
    ]);
    // Titles come from i18n, not facets.
    expect(shelves[0].title).toBe('Grade 1–3');
  });

  it('returns an empty list when a taxonomy axis has no facets', () => {
    expect(buildShelves('genre', undefined, 'en')).toEqual([]);
  });
});

describe('filtersToParams', () => {
  it('expands a level band into a difficulty range', () => {
    const params = filtersToParams({ level: 'intermediate', instrument: ['guitar'] });
    expect(params.difficultyMin).toBe(4);
    expect(params.difficultyMax).toBe(6);
    expect(params.instrument).toEqual(['guitar']);
  });

  it('omits the difficulty range when no band is set, and normalizes empties', () => {
    const params = filtersToParams({ type: 'score' });
    expect(params.difficultyMin).toBeUndefined();
    expect(params.difficultyMax).toBeUndefined();
    expect(params.genre).toEqual([]);
    expect(params.q).toBeUndefined();
    expect(params.type).toBe('score');
  });
});
