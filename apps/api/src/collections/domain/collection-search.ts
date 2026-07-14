import type { CollectionSummaryView } from './collection';

export type CollectionSort = 'featured' | 'newest' | 'popular' | 'az' | 'difficulty';

/** A normalized discovery query (the controller parses raw query strings into this). */
export interface CollectionSearchQuery {
  q?: string;
  kind?: string;
  eras: string[];
  instruments: string[];
  techniques: string[];
  moods: string[];
  curators: string[];
  difficulty?: number;
  featured?: boolean;
  sort: CollectionSort;
  page: number;
  pageSize: number;
}

export interface CollectionFacetValue {
  value: string;
  label: string;
  count: number;
}

export interface CollectionSearchFacets {
  kinds: CollectionFacetValue[];
  eras: CollectionFacetValue[];
  instruments: CollectionFacetValue[];
  techniques: CollectionFacetValue[];
  moods: CollectionFacetValue[];
  curators: CollectionFacetValue[];
  difficulties: CollectionFacetValue[];
}

export interface CollectionSearchResult {
  items: CollectionSummaryView[];
  facets: CollectionSearchFacets;
  total: number;
  page: number;
  pageSize: number;
}

const SORTS: CollectionSort[] = ['featured', 'newest', 'popular', 'az', 'difficulty'];

export function parseCollectionSort(raw: string | undefined): CollectionSort {
  return SORTS.includes(raw as CollectionSort) ? (raw as CollectionSort) : 'featured';
}
