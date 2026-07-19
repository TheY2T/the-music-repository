/**
 * Pure logic for the collections hub (mirrors catalogue-shelves.ts): the browse axes and the
 * facet-derived shelf builder. Framework-free so it's unit-testable without the hook-driven island.
 */
import type { MessageKey } from '@TheY2T/tmr-i18n';

export const COLLECTION_AXES = ['kind', 'era', 'instrument'] as const;
export type CollectionAxis = (typeof COLLECTION_AXES)[number];

export const COLLECTION_AXIS_LABEL: Record<CollectionAxis, MessageKey> = {
  kind: 'collections.facetKind',
  era: 'collections.facetEra',
  instrument: 'collections.facetInstrument',
};

/** Pre-scoped filters used when the hub opens the grid from a shelf's "See all". */
export interface CollectionsFilters {
  q?: string;
  kind?: string;
  era?: string[];
  instrument?: string[];
  technique?: string[];
  difficulty?: number;
}

export interface CollectionFacetBucket {
  value: string;
  label: string;
  count: number;
}

/** Facet distributions the hub reads to build its shelves (subset of the collections search facets). */
export interface CollectionHubFacets {
  kinds: CollectionFacetBucket[];
  eras: CollectionFacetBucket[];
  instruments: CollectionFacetBucket[];
  techniques: CollectionFacetBucket[];
  difficulties: CollectionFacetBucket[];
}

export interface CollectionShelfConfig {
  key: string;
  title: string;
  filters: CollectionsFilters;
}

const MAX_SHELVES = 6;

/** Build the shelf list for an axis from live facet distributions (one shelf per top facet value). */
export function buildCollectionShelves(
  axis: CollectionAxis,
  facets: CollectionHubFacets | undefined,
): CollectionShelfConfig[] {
  switch (axis) {
    case 'kind':
      return (facets?.kinds ?? [])
        .slice(0, MAX_SHELVES)
        .map((f) => ({ key: f.value, title: f.label, filters: { kind: f.value } }));
    case 'era':
      return (facets?.eras ?? [])
        .slice(0, MAX_SHELVES)
        .map((f) => ({ key: f.value, title: f.label, filters: { era: [f.value] } }));
    case 'instrument':
      return (facets?.instruments ?? [])
        .slice(0, MAX_SHELVES)
        .map((f) => ({ key: f.value, title: f.label, filters: { instrument: [f.value] } }));
  }
}

/** Map a shelf/entry's filters onto collections search params. */
export function collectionFiltersToParams(f: CollectionsFilters) {
  return {
    q: f.q || undefined,
    kind: f.kind,
    era: f.era ?? [],
    instrument: f.instrument ?? [],
    technique: f.technique ?? [],
    difficulty: f.difficulty,
  };
}
