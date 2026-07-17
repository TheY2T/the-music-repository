import { describe, expect, it } from 'vitest';
import {
  buildColumns,
  byCountThenValue,
  byFixedOrder,
  countBuckets,
  groupIntoShelves,
  orderBuckets,
} from './admin-manager';

interface Row {
  slug: string;
  status: string;
  tags: string[];
  n: number;
}

const ROWS: Row[] = [
  { slug: 'a', status: 'published', tags: ['x', 'y'], n: 3 },
  { slug: 'b', status: 'draft', tags: ['x'], n: 1 },
  { slug: 'c', status: 'published', tags: ['y'], n: 2 },
  { slug: 'd', status: 'draft', tags: [], n: 4 },
];

const byN = (a: Row, b: Row) => a.n - b.n;

describe('groupIntoShelves', () => {
  it('groups by value and sorts shelves + rows', () => {
    const shelves = groupIntoShelves(
      ROWS,
      (r) => [r.status],
      byFixedOrder(['draft', 'published']),
      byN,
    );
    expect(shelves.map((s) => s.value)).toEqual(['draft', 'published']);
    expect(shelves.map((s) => s.count)).toEqual([2, 2]);
    // rows sorted by n within a shelf
    expect(shelves[0].rows.map((r) => r.slug)).toEqual(['b', 'd']);
  });

  it('supports multi-valued accessors and drops rows with no value', () => {
    const shelves = groupIntoShelves(ROWS, (r) => r.tags, byCountThenValue, byN);
    const x = shelves.find((s) => s.value === 'x');
    expect(x?.rows.map((r) => r.slug).sort()).toEqual(['a', 'b']);
    // 'd' has no tags → appears in no shelf
    expect(shelves.flatMap((s) => s.rows.map((r) => r.slug))).not.toContain('d');
  });
});

describe('buildColumns', () => {
  it('always returns the fixed columns in order, even when empty', () => {
    const cols = buildColumns(ROWS, ['draft', 'review', 'published'], (r) => r.status, byN);
    expect(cols.map((c) => c.status)).toEqual(['draft', 'review', 'published']);
    expect(cols.map((c) => c.count)).toEqual([2, 0, 2]);
  });
});

describe('countBuckets / orderBuckets', () => {
  it('counts by descending count then value, and reorders by a fixed list', () => {
    const buckets = countBuckets(ROWS.flatMap((r) => r.tags));
    expect(buckets).toEqual([
      { value: 'x', count: 2 },
      { value: 'y', count: 2 },
    ]);
    const statusBuckets = orderBuckets(countBuckets(ROWS.map((r) => r.status)), [
      'published',
      'draft',
    ]);
    expect(statusBuckets.map((b) => b.value)).toEqual(['published', 'draft']);
  });
});
