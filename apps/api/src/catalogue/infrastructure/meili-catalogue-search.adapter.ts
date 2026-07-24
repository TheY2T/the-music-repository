import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { type Index, MeiliSearch } from 'meilisearch';
import { CatalogueSearch } from '../application/ports/catalogue-search.port';
import type { ContentRepository } from '../application/ports/content-repository.port';
import {
  type CatalogueQuery,
  type CatalogueResult,
  type CatalogueSort,
  type ContentItem,
  type ContentSummaryView,
  type FacetValue,
  normalizeKey,
  slugToLabel,
  toContentSummaryView,
} from '../domain/content-item';

/** A catalogue document as indexed in Meilisearch. `view` is the summary shape returned verbatim on
 * search; the remaining fields drive text search, filtering, faceting, and sorting. */
interface CatalogueDoc {
  id: string;
  view: ContentSummaryView;
  title: string;
  summary: string;
  genreNames: string;
  instrumentNames: string;
  topicNames: string;
  visibility: string;
  type: string;
  difficulty?: number;
  genreSlugs: string[];
  instrumentSlugs: string[];
  topicSlugs: string[];
  era?: string;
  composer?: string;
  key?: string;
}

const SEARCHABLE = ['title', 'summary', 'genreNames', 'instrumentNames', 'topicNames'];
const FILTERABLE = [
  'visibility',
  'type',
  'difficulty',
  'genreSlugs',
  'instrumentSlugs',
  'topicSlugs',
  'era',
  'composer',
  'key',
];
const SORTABLE = ['difficulty', 'title'];
const FACETS = [
  'genreSlugs',
  'instrumentSlugs',
  'topicSlugs',
  'type',
  'era',
  'composer',
  'key',
  'difficulty',
];

/**
 * Faceted catalogue search over Meilisearch — typo-tolerant text ranking plus the same filter, facet,
 * sort, and pagination contract as the in-memory Postgres adapter. Filters combine as per-facet OR /
 * across-facet AND; facet counts cover the filtered set; only public/authed/premium items are eligible.
 */
@Injectable()
export class MeiliCatalogueSearch extends CatalogueSearch {
  private readonly client: MeiliSearch;
  private readonly index: Index<CatalogueDoc>;

  constructor(config: ConfigService, _repository: ContentRepository) {
    super();
    this.client = new MeiliSearch({
      host: config.get<string>('MEILI_HOST') ?? '',
      apiKey: config.get<string>('MEILI_API_KEY'),
    });
    const prefix =
      config.get<string>('MEILI_INDEX_PREFIX') ?? config.get<string>('APP_ENV') ?? 'dev';
    this.index = this.client.index<CatalogueDoc>(`${prefix}_content`);
  }

  async indexAll(items: ContentItem[]): Promise<void> {
    await this.index.updateSettings({
      searchableAttributes: SEARCHABLE,
      filterableAttributes: FILTERABLE,
      sortableAttributes: SORTABLE,
    });
    await this.index.deleteAllDocuments();
    if (items.length > 0) {
      const task = await this.index.addDocuments(items.map(toDoc), { primaryKey: 'id' });
      await this.client.tasks.waitForTask(task.taskUid);
    }
  }

  async search(query: CatalogueQuery): Promise<CatalogueResult> {
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
        genres: taxonomyFacet(dist.genreSlugs),
        instruments: taxonomyFacet(dist.instrumentSlugs),
        topics: taxonomyFacet(dist.topicSlugs),
        eras: valueFacet(dist.era),
        types: taxonomyFacet(dist.type),
        difficulties: difficultyFacet(dist.difficulty),
        composers: valueFacet(dist.composer),
        keys: valueFacet(dist.key),
      },
      total: res.totalHits ?? res.hits.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}

function toDoc(item: ContentItem): CatalogueDoc {
  const era = nonEmpty(item.details?.era);
  const composer = nonEmpty(item.details?.composer);
  const key = nonEmpty(normalizeKey(item.details?.key));
  return {
    id: item.id,
    view: toContentSummaryView(item),
    title: item.title,
    summary: item.summary ?? '',
    genreNames: item.genres.map((g) => g.name).join(' '),
    instrumentNames: item.instruments.map((i) => i.name).join(' '),
    topicNames: item.topics.map((t) => t.name).join(' '),
    visibility: item.visibility,
    type: item.type,
    ...(item.difficulty != null ? { difficulty: item.difficulty } : {}),
    genreSlugs: item.genres.map((g) => g.slug),
    instrumentSlugs: item.instruments.map((i) => i.slug),
    topicSlugs: item.topics.map((t) => t.slug),
    ...(era ? { era } : {}),
    ...(composer ? { composer } : {}),
    ...(key ? { key } : {}),
  };
}

function buildFilter(query: CatalogueQuery): string[] {
  const clauses: string[] = [inClause('visibility', ['public', 'authed', 'premium'])];
  if (query.type) clauses.push(`type = ${quote(query.type)}`);
  if (query.difficulty != null) clauses.push(`difficulty = ${query.difficulty}`);
  if (query.difficultyMin != null) clauses.push(`difficulty >= ${query.difficultyMin}`);
  if (query.difficultyMax != null) clauses.push(`difficulty <= ${query.difficultyMax}`);
  pushIn(clauses, 'genreSlugs', query.genres);
  pushIn(clauses, 'instrumentSlugs', query.instruments);
  pushIn(clauses, 'topicSlugs', query.topics);
  pushIn(clauses, 'era', query.eras);
  pushIn(clauses, 'composer', query.composers);
  pushIn(clauses, 'key', query.keys);
  return clauses;
}

function buildSort(sort: CatalogueSort | undefined): string[] | undefined {
  switch (sort) {
    case 'difficulty-asc':
      return ['difficulty:asc'];
    case 'difficulty-desc':
      return ['difficulty:desc'];
    case 'title-asc':
      return ['title:asc'];
    default:
      // Relevance: Meilisearch's ranking (typo-tolerant), no explicit sort.
      return undefined;
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

// --- facet mapping (facet distribution → FacetValue[]) ---
type Distribution = Record<string, number> | undefined;

/** Facet keyed by a taxonomy/type slug, labelled from the slug, ordered by count desc. */
function taxonomyFacet(dist: Distribution): FacetValue[] {
  return Object.entries(dist ?? {})
    .map(([value, count]) => ({ value, label: slugToLabel(value), count }))
    .sort((a, b) => b.count - a.count);
}

/** Facet whose value is already a display string (era/composer/key), ordered by count desc. */
function valueFacet(dist: Distribution): FacetValue[] {
  return Object.entries(dist ?? {})
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count);
}

/** Difficulty facet, labelled `Grade N`, ordered by grade asc. */
function difficultyFacet(dist: Distribution): FacetValue[] {
  return Object.entries(dist ?? {})
    .map(([value, count]) => ({ value, label: `Grade ${value}`, count }))
    .sort((a, b) => Number(a.value) - Number(b.value));
}

function nonEmpty(value: string | null | undefined): string | null {
  return value?.trim() ? value : null;
}
