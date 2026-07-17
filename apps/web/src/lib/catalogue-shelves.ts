/**
 * Pure logic for the catalogue hub (ADR 0031): the level-band model, the browse axes, and the
 * facet-derived shelf builder. Kept framework-free so it's unit-testable without rendering the
 * hook-driven island (see docs/features/catalogue-redesign.md).
 */
import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';

/** Difficulty (1..10) grouped into named bands — the level facet is single-select (one range). */
export const LEVEL_BANDS = [
  { key: 'beginner', min: 1, max: 3 },
  { key: 'intermediate', min: 4, max: 6 },
  { key: 'advanced', min: 7, max: 8 },
  { key: 'expert', min: 9, max: 10 },
] as const;
export type LevelBand = (typeof LEVEL_BANDS)[number]['key'];

export const LEVEL_LABEL: Record<LevelBand, MessageKey> = {
  beginner: 'catalogue.level.beginner',
  intermediate: 'catalogue.level.intermediate',
  advanced: 'catalogue.level.advanced',
  expert: 'catalogue.level.expert',
};

/** The inclusive difficulty range for a level band, or undefined when no band is selected. */
export function bandRange(level: string | undefined): { min: number; max: number } | undefined {
  return LEVEL_BANDS.find((b) => b.key === level);
}

/** One facet bucket as returned by the catalogue search. */
export interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

/** Facet distributions the hub reads to build its shelves (subset of the API's `Facets`). */
export interface HubFacets {
  genres: FacetBucket[];
  instruments: FacetBucket[];
  topics: FacetBucket[];
  eras: FacetBucket[];
  types: FacetBucket[];
  difficulties: FacetBucket[];
}

/** Sum the per-grade difficulty distribution into a single band's count. */
export function bandCount(
  difficulties: FacetBucket[] | undefined,
  band: { min: number; max: number },
): number {
  return (difficulties ?? [])
    .filter((f) => {
      const grade = Number(f.value);
      return grade >= band.min && grade <= band.max;
    })
    .reduce((sum, f) => sum + f.count, 0);
}

/** Pre-scoped filters used when the hub opens the grid from a shelf's "See all". */
export interface CatalogueGridFilters {
  q?: string;
  genre?: string[];
  instrument?: string[];
  era?: string[];
  topic?: string[];
  type?: string;
  level?: LevelBand;
}

export const AXES = ['instrument', 'level', 'era', 'genre', 'format'] as const;
export type AxisKey = (typeof AXES)[number];
export const AXIS_LABEL: Record<AxisKey, MessageKey> = {
  instrument: 'catalogue.axis.instrument',
  level: 'catalogue.axis.level',
  era: 'catalogue.axis.era',
  genre: 'catalogue.axis.genre',
  format: 'catalogue.axis.format',
};

export interface ShelfConfig {
  key: string;
  title: string;
  filters: CatalogueGridFilters;
}

const MAX_TAXONOMY_SHELVES = 4;

/** Build the shelf list for an axis from live facet distributions. Level shelves are fixed bands;
 * every other axis derives one shelf per top facet value, so a re-sliced axis never shows dead rows. */
export function buildShelves(
  axis: AxisKey,
  facets: HubFacets | undefined,
  locale: Locale,
): ShelfConfig[] {
  switch (axis) {
    case 'instrument':
      return (facets?.instruments ?? [])
        .slice(0, MAX_TAXONOMY_SHELVES)
        .map((f) => ({ key: f.value, title: f.label, filters: { instrument: [f.value] } }));
    case 'era':
      return (facets?.eras ?? [])
        .slice(0, MAX_TAXONOMY_SHELVES)
        .map((f) => ({ key: f.value, title: f.label, filters: { era: [f.value] } }));
    case 'genre':
      return (facets?.genres ?? [])
        .slice(0, MAX_TAXONOMY_SHELVES)
        .map((f) => ({ key: f.value, title: f.label, filters: { genre: [f.value] } }));
    case 'format':
      return (facets?.types ?? []).map((f) => ({
        key: f.value,
        title: f.label,
        filters: { type: f.value },
      }));
    case 'level':
      return LEVEL_BANDS.map((b) => ({
        key: b.key,
        title: t(locale, LEVEL_LABEL[b.key]),
        filters: { level: b.key },
      }));
  }
}

/** Map a shelf/entry's filters onto catalogue search params (level band → difficulty range). */
export function filtersToParams(filters: CatalogueGridFilters) {
  const band = bandRange(filters.level);
  return {
    q: filters.q || undefined,
    genre: filters.genre ?? [],
    instrument: filters.instrument ?? [],
    era: filters.era ?? [],
    topic: filters.topic ?? [],
    type: filters.type,
    difficultyMin: band?.min,
    difficultyMax: band?.max,
  };
}
