/**
 * Generic, entity-agnostic core for the admin managers (content, collections, help). The manager
 * loads every row up front, so all grouping, board-splitting, faceting, and filtering happens in
 * memory here via accessor callbacks. Framework- and i18n-free so it's unit-testable; each entity
 * supplies a config (see `EntityManager`) that adapts these primitives to its own shape.
 */

export interface Shelf<Row> {
  /** Stable key = the axis value. */
  key: string;
  value: string;
  count: number;
  rows: Row[];
}

/** How the shelf list for an axis is ordered. */
export type ShelfOrder<Row> = (a: [string, Row[]], b: [string, Row[]]) => number;

/** Order shelves by descending count, then value — the default for open-ended taxonomy axes. */
export function byCountThenValue<Row>(a: [string, Row[]], b: [string, Row[]]): number {
  return b[1].length - a[1].length || a[0].localeCompare(b[0]);
}

/** Order shelves by a fixed value list (unlisted values sort last) — for status/level bands. */
export function byFixedOrder<Row>(order: readonly string[]): ShelfOrder<Row> {
  const rank = (v: string) => {
    const i = order.indexOf(v);
    return i === -1 ? order.length : i;
  };
  return (a, b) => rank(a[0]) - rank(b[0]);
}

/**
 * Group rows into one shelf per axis value. `getValues` returns the axis value(s) a row belongs to
 * (multi-valued for taxonomy, empty when the field is unset → the row joins no shelf, so a re-sliced
 * axis never shows a dead row).
 */
export function groupIntoShelves<Row>(
  rows: Row[],
  getValues: (row: Row) => string[],
  order: ShelfOrder<Row>,
  sortRows: (a: Row, b: Row) => number,
): Shelf<Row>[] {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    for (const value of getValues(row)) {
      const list = groups.get(value) ?? [];
      list.push(row);
      groups.set(value, list);
    }
  }
  return [...groups.entries()].sort(order).map(([value, grouped]) => ({
    key: value,
    value,
    count: grouped.length,
    rows: [...grouped].sort(sortRows),
  }));
}

export interface BoardColumn<Row> {
  status: string;
  count: number;
  rows: Row[];
}

/** Split rows into fixed status columns — always all columns, even when empty. */
export function buildColumns<Row>(
  rows: Row[],
  statuses: readonly string[],
  getStatus: (row: Row) => string,
  sortRows: (a: Row, b: Row) => number,
): BoardColumn<Row>[] {
  return statuses.map((status) => {
    const columnRows = rows.filter((r) => getStatus(r) === status).sort(sortRows);
    return { status, count: columnRows.length, rows: columnRows };
  });
}

export interface FacetBucket {
  value: string;
  count: number;
}

/** Count occurrences of each value, ordered by descending count then value. */
export function countBuckets(values: string[]): FacetBucket[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Re-order buckets by a fixed value list (for status/level, which have a natural order). */
export function orderBuckets(buckets: FacetBucket[], order: readonly string[]): FacetBucket[] {
  return [...buckets].sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
}
