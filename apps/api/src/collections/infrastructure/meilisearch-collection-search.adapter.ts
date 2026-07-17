import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import { slugToLabel } from '../../catalogue/domain/content-item';
import { CollectionSearchIndex } from '../application/ports/collection-search.port';
import type {
  Collection,
  CollectionRatingAggregate,
  CollectionSummaryView,
} from '../domain/collection';
import type {
  CollectionFacetValue,
  CollectionSearchQuery,
  CollectionSearchResult,
  CollectionSort,
} from '../domain/collection-search';

const INDEX_UID = 'collections';

interface IndexDoc {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string;
  curationType: string;
  visibility: string;
  itemCount: number;
  featured: boolean;
  featuredRank: number;
  difficultyMin: number | null;
  difficultyMax: number | null;
  grades: number[];
  estMinutes: number | null;
  curatorName: string | null;
  heroImageKey: string | null;
  accent: string | null;
  tags: string[];
  eras: string[];
  genres: string[];
  techniques: string[];
  moods: string[];
  instruments: string[];
  popularity: number;
  createdAtTs: number;
  averageRating: number | null;
  ratingCount: number;
}

const SORT_MAP: Record<CollectionSort, string[]> = {
  featured: ['featuredRank:desc', 'popularity:desc'],
  newest: ['createdAtTs:desc'],
  popular: ['popularity:desc'],
  az: ['title:asc'],
  difficulty: ['difficultyMin:asc'],
};

@Injectable()
export class MeilisearchCollectionSearch extends CollectionSearchIndex implements OnModuleInit {
  private readonly client: Meilisearch;

  constructor(config: ConfigService) {
    super();
    this.client = new Meilisearch({
      host: config.getOrThrow<string>('MEILI_HOST'),
      apiKey: config.get<string>('MEILI_MASTER_KEY'),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureIndex();
    } catch {
      // reindex/search surface a clear error when actually used
    }
  }

  private async ensureIndex(): Promise<void> {
    await this.client.createIndex(INDEX_UID, { primaryKey: 'id' }).catch(() => undefined);
    await this.client.index(INDEX_UID).updateSettings({
      searchableAttributes: ['title', 'summary', 'curatorName', 'tags'],
      filterableAttributes: [
        'kind',
        'grades',
        'eras',
        'instruments',
        'techniques',
        'moods',
        'curatorName',
        'curationType',
        'featured',
        'visibility',
      ],
      sortableAttributes: [
        'title',
        'createdAtTs',
        'popularity',
        'featuredRank',
        'difficultyMin',
        'averageRating',
      ],
    });
  }

  async indexAll(
    collections: Collection[],
    ratings: Map<string, CollectionRatingAggregate>,
  ): Promise<void> {
    await this.ensureIndex();
    const index = this.client.index(INDEX_UID);
    await index.deleteAllDocuments();
    // Never index private collections (they must not surface in discovery).
    const docs = collections
      .filter((c) => c.visibility !== 'private')
      .map((c) => toIndexDoc(c, ratings.get(c.slug)));
    if (docs.length > 0) {
      const task = await index.addDocuments(docs);
      await this.client.tasks.waitForTask(task);
    }
  }

  async search(query: CollectionSearchQuery): Promise<CollectionSearchResult> {
    const filter: (string | string[])[] = [["visibility = 'public'", "visibility = 'authed'"]];
    if (query.kind) {
      filter.push(`kind = '${query.kind}'`);
    }
    if (query.difficulty != null) {
      filter.push(`grades = ${query.difficulty}`);
    }
    if (query.featured) {
      filter.push('featured = true');
    }
    pushOr(filter, 'eras', query.eras);
    pushOr(filter, 'instruments', query.instruments);
    pushOr(filter, 'techniques', query.techniques);
    pushOr(filter, 'moods', query.moods);
    pushOr(filter, 'curatorName', query.curators);

    const result = await this.client.index(INDEX_UID).search(query.q ?? '', {
      filter,
      facets: ['kind', 'eras', 'instruments', 'techniques', 'moods', 'curatorName', 'grades'],
      sort: SORT_MAP[query.sort],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });

    const hits = result.hits as unknown as IndexDoc[];
    const dist = result.facetDistribution ?? {};
    return {
      items: hits.map(toSummaryView),
      facets: {
        kinds: toFacet(dist.kind),
        eras: toFacet(dist.eras),
        instruments: toFacet(dist.instruments),
        techniques: toFacet(dist.techniques),
        moods: toFacet(dist.moods),
        curators: toFacet(dist.curatorName),
        difficulties: toDifficultyFacet(dist.grades),
      },
      total: result.estimatedTotalHits ?? result.hits.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}

function pushOr(filter: (string | string[])[], field: string, values: string[]): void {
  if (values.length) {
    filter.push(values.map((v) => `${field} = '${v.replace(/'/g, "\\'")}'`));
  }
}

function toIndexDoc(c: Collection, rating: CollectionRatingAggregate | undefined): IndexDoc {
  const grades: number[] = [];
  if (c.difficultyMin != null) {
    const max = c.difficultyMax ?? c.difficultyMin;
    for (let g = c.difficultyMin; g <= max; g++) {
      grades.push(g);
    }
  }
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    kind: c.kind,
    curationType: c.curationType,
    visibility: c.visibility,
    itemCount: c.itemSlugs.length,
    featured: c.featured,
    featuredRank: c.featured ? 1 : 0,
    difficultyMin: c.difficultyMin,
    difficultyMax: c.difficultyMax,
    grades,
    estMinutes: c.estMinutes,
    curatorName: c.curatorName,
    heroImageKey: c.heroImageKey,
    accent: c.accent,
    tags: c.tags ?? [],
    eras: c.facets?.era ?? [],
    genres: c.facets?.genre ?? [],
    techniques: c.facets?.technique ?? [],
    moods: c.facets?.mood ?? [],
    instruments: c.facets?.instrument ?? [],
    popularity: c.popularity,
    createdAtTs: c.createdAt.getTime(),
    averageRating: rating?.average ?? null,
    ratingCount: rating?.count ?? 0,
  };
}

function toSummaryView(hit: IndexDoc): CollectionSummaryView {
  return {
    slug: hit.slug,
    title: hit.title,
    summary: hit.summary ?? undefined,
    kind: hit.kind,
    visibility: hit.visibility,
    // The search index only holds published collections, so status is always published here.
    status: 'published',
    curationType: hit.curationType,
    itemCount: hit.itemCount,
    featured: hit.featured,
    difficultyMin: hit.difficultyMin ?? undefined,
    difficultyMax: hit.difficultyMax ?? undefined,
    estMinutes: hit.estMinutes ?? undefined,
    curatorName: hit.curatorName ?? undefined,
    heroImageKey: hit.heroImageKey ?? undefined,
    accent: hit.accent ?? undefined,
    tags: hit.tags,
    popularity: hit.popularity,
    averageRating: hit.averageRating ?? undefined,
    ratingCount: hit.ratingCount,
  };
}

function toFacet(distribution: Record<string, number> | undefined): CollectionFacetValue[] {
  if (!distribution) {
    return [];
  }
  return Object.entries(distribution)
    .map(([value, count]) => ({ value, label: slugToLabel(value), count }))
    .sort((a, b) => b.count - a.count);
}

function toDifficultyFacet(
  distribution: Record<string, number> | undefined,
): CollectionFacetValue[] {
  if (!distribution) {
    return [];
  }
  return Object.entries(distribution)
    .map(([value, count]) => ({ value, label: `Grade ${value}`, count }))
    .sort((a, b) => Number(a.value) - Number(b.value));
}
