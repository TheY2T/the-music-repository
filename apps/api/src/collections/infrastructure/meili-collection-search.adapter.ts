import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { type Index, MeiliSearch } from 'meilisearch';
import { slugToLabel } from '../../catalogue/domain/content-item';
import { CollectionSearchIndex } from '../application/ports/collection-search.port';
import {
  type Collection,
  type CollectionRatingAggregate,
  type CollectionSummaryView,
  toCollectionSummaryView,
} from '../domain/collection';
import type {
  CollectionFacetValue,
  CollectionSearchQuery,
  CollectionSearchResult,
  CollectionSort,
} from '../domain/collection-search';

/** A collection document as indexed in Meilisearch. `view` is returned verbatim on search; the rest
 * drives text search, filtering, faceting, and sorting. Ratings are snapshotted at index time and
 * refreshed on every reindex (rating changes reindex the collection). */
interface CollectionDoc {
  id: string;
  view: CollectionSummaryView;
  title: string;
  summary: string;
  curatorNameText: string;
  tagsText: string;
  visibility: string;
  kind: string;
  eras: string[];
  instruments: string[];
  techniques: string[];
  moods: string[];
  curator?: string;
  featured: boolean;
  featuredRank: number;
  grades: string[];
  difficultyMin?: number;
  popularity: number;
  createdAtMs: number;
  titleSort: string;
}

const SEARCHABLE = ['title', 'summary', 'curatorNameText', 'tagsText'];
const FILTERABLE = [
  'visibility',
  'kind',
  'eras',
  'instruments',
  'techniques',
  'moods',
  'curator',
  'featured',
  'grades',
];
const SORTABLE = ['createdAtMs', 'popularity', 'titleSort', 'difficultyMin', 'featuredRank'];
const FACETS = ['kind', 'eras', 'instruments', 'techniques', 'moods', 'curator', 'grades'];

/**
 * Faceted collections discovery over Meilisearch — the same filter/facet/sort/pagination contract as
 * the in-memory Postgres adapter. Only public/authed collections are eligible; filters combine as
 * per-facet OR / across-facet AND; facet counts cover the filtered set.
 */
@Injectable()
export class MeiliCollectionSearch extends CollectionSearchIndex {
  private readonly client: MeiliSearch;
  private readonly index: Index<CollectionDoc>;

  constructor(config: ConfigService) {
    super();
    this.client = new MeiliSearch({
      host: config.get<string>('MEILI_HOST') ?? '',
      apiKey: config.get<string>('MEILI_API_KEY'),
    });
    const prefix =
      config.get<string>('MEILI_INDEX_PREFIX') ?? config.get<string>('APP_ENV') ?? 'dev';
    this.index = this.client.index<CollectionDoc>(`${prefix}_collections`);
  }

  async indexAll(
    collections: Collection[],
    ratings: Map<string, CollectionRatingAggregate>,
  ): Promise<void> {
    await this.index.updateSettings({
      searchableAttributes: SEARCHABLE,
      filterableAttributes: FILTERABLE,
      sortableAttributes: SORTABLE,
    });
    await this.index.deleteAllDocuments();
    const discoverable = collections.filter(
      (c) => c.visibility === 'public' || c.visibility === 'authed',
    );
    if (discoverable.length > 0) {
      const task = await this.index.addDocuments(
        discoverable.map((c) => toDoc(c, ratings.get(c.slug))),
        { primaryKey: 'id' },
      );
      await this.client.tasks.waitForTask(task.taskUid);
    }
  }

  async search(query: CollectionSearchQuery): Promise<CollectionSearchResult> {
    const res = await this.index.search(query.q?.trim() || '', {
      filter: buildFilter(query),
      facets: FACETS,
      sort: buildSort(query.sort),
      page: query.page,
      hitsPerPage: query.pageSize,
    });
    const dist = res.facetDistribution ?? {};
    return {
      items: res.hits.map((hit) => hit.view),
      facets: {
        kinds: labelFacet(dist.kind),
        eras: labelFacet(dist.eras),
        instruments: labelFacet(dist.instruments),
        techniques: labelFacet(dist.techniques),
        moods: labelFacet(dist.moods),
        curators: labelFacet(dist.curator),
        difficulties: difficultyFacet(dist.grades),
      },
      total: res.totalHits ?? res.hits.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}

function toDoc(c: Collection, rating: CollectionRatingAggregate | undefined): CollectionDoc {
  return {
    id: c.id,
    view: toCollectionSummaryView(c, rating),
    title: c.title,
    summary: c.summary ?? '',
    curatorNameText: c.curatorName ?? '',
    tagsText: (c.tags ?? []).join(' '),
    visibility: c.visibility,
    kind: c.kind,
    eras: c.facets?.era ?? [],
    instruments: c.facets?.instrument ?? [],
    techniques: c.facets?.technique ?? [],
    moods: c.facets?.mood ?? [],
    ...(c.curatorName ? { curator: c.curatorName } : {}),
    featured: c.featured,
    featuredRank: c.featured ? 1 : 0,
    grades: gradeBand(c),
    ...(c.difficultyMin != null ? { difficultyMin: c.difficultyMin } : {}),
    popularity: c.popularity,
    createdAtMs: c.createdAt.getTime(),
    titleSort: c.title,
  };
}

/** Each grade in the collection's [min..max] band, as strings (drives the difficulty facet + filter). */
function gradeBand(c: Collection): string[] {
  if (c.difficultyMin == null) return [];
  const max = c.difficultyMax ?? c.difficultyMin;
  const grades: string[] = [];
  for (let g = c.difficultyMin; g <= max; g++) grades.push(String(g));
  return grades;
}

function buildFilter(query: CollectionSearchQuery): string[] {
  const clauses: string[] = [inClause('visibility', ['public', 'authed'])];
  if (query.kind) clauses.push(`kind = ${quote(query.kind)}`);
  if (query.difficulty != null) clauses.push(inClause('grades', [String(query.difficulty)]));
  if (query.featured) clauses.push('featured = true');
  pushIn(clauses, 'eras', query.eras);
  pushIn(clauses, 'instruments', query.instruments);
  pushIn(clauses, 'techniques', query.techniques);
  pushIn(clauses, 'moods', query.moods);
  pushIn(clauses, 'curator', query.curators);
  return clauses;
}

function buildSort(sort: CollectionSort): string[] {
  switch (sort) {
    case 'newest':
      return ['createdAtMs:desc'];
    case 'popular':
      return ['popularity:desc'];
    case 'az':
      return ['titleSort:asc'];
    case 'difficulty':
      return ['difficultyMin:asc'];
    default:
      // featured: featured first, then most popular.
      return ['featuredRank:desc', 'popularity:desc'];
  }
}

// --- filter helpers ---
function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function inClause(attr: string, values: string[]): string {
  return `${attr} IN [${values.map(quote).join(', ')}]`;
}

function pushIn(clauses: string[], attr: string, selected: string[]): void {
  if (selected.length > 0) clauses.push(inClause(attr, selected));
}

// --- facet mapping ---
type Distribution = Record<string, number> | undefined;

/** Facet labelled from the value via `slugToLabel`, ordered by count desc. */
function labelFacet(dist: Distribution): CollectionFacetValue[] {
  return Object.entries(dist ?? {})
    .map(([value, count]) => ({ value, label: slugToLabel(value), count }))
    .sort((a, b) => b.count - a.count);
}

/** Difficulty facet over the expanded grade band, labelled `Grade N`, ordered by grade asc. */
function difficultyFacet(dist: Distribution): CollectionFacetValue[] {
  return Object.entries(dist ?? {})
    .map(([value, count]) => ({ value, label: `Grade ${value}`, count }))
    .sort((a, b) => Number(a.value) - Number(b.value));
}
