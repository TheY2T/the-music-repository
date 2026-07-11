import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import { CatalogueSearch } from '../application/ports/catalogue-search.port';
import {
  type CatalogueQuery,
  type CatalogueResult,
  type ContentItem,
  type Facets,
  type FacetValue,
  slugToLabel,
} from '../domain/content-item';

const INDEX_UID = 'content_items';

interface IndexDoc {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: string;
  difficulty: number | null;
  visibility: string;
  genreSlugs: string[];
  instrumentSlugs: string[];
  topicSlugs: string[];
  genres: { slug: string; name: string }[];
  instruments: { slug: string; name: string }[];
  topics: { slug: string; name: string }[];
}

@Injectable()
export class MeilisearchCatalogueSearch extends CatalogueSearch implements OnModuleInit {
  private readonly client: Meilisearch;

  constructor(config: ConfigService) {
    super();
    this.client = new Meilisearch({
      host: config.getOrThrow<string>('MEILI_HOST'),
      apiKey: config.get<string>('MEILI_MASTER_KEY'),
    });
  }

  async onModuleInit(): Promise<void> {
    // Best-effort: don't crash boot if Meilisearch isn't up yet.
    try {
      await this.ensureIndex();
    } catch {
      // reindex/search will surface a clear error when actually used
    }
  }

  private async ensureIndex(): Promise<void> {
    await this.client.createIndex(INDEX_UID, { primaryKey: 'id' }).catch(() => undefined);
    await this.client.index(INDEX_UID).updateSettings({
      searchableAttributes: ['title', 'summary'],
      filterableAttributes: [
        'genreSlugs',
        'instrumentSlugs',
        'topicSlugs',
        'type',
        'difficulty',
        'visibility',
      ],
      sortableAttributes: ['title', 'difficulty'],
    });
  }

  async indexAll(items: ContentItem[]): Promise<void> {
    await this.ensureIndex();
    const index = this.client.index(INDEX_UID);
    await index.deleteAllDocuments();
    if (items.length > 0) {
      const task = await index.addDocuments(items.map(toIndexDoc));
      await this.client.tasks.waitForTask(task);
    }
  }

  async search(query: CatalogueQuery): Promise<CatalogueResult> {
    // Per-facet OR (nested arrays), across-facet AND. Only public content is searchable here.
    const filter: (string | string[])[] = ["visibility = 'public'"];
    if (query.type) {
      filter.push(`type = '${query.type}'`);
    }
    if (query.difficulty != null) {
      filter.push(`difficulty = ${query.difficulty}`);
    }
    if (query.genres.length) {
      filter.push(query.genres.map((g) => `genreSlugs = '${g}'`));
    }
    if (query.instruments.length) {
      filter.push(query.instruments.map((i) => `instrumentSlugs = '${i}'`));
    }
    if (query.topics.length) {
      filter.push(query.topics.map((t) => `topicSlugs = '${t}'`));
    }

    const result = await this.client.index(INDEX_UID).search(query.q ?? '', {
      filter,
      facets: ['genreSlugs', 'instrumentSlugs', 'topicSlugs', 'type', 'difficulty'],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });

    const hits = result.hits as unknown as IndexDoc[];
    const dist = result.facetDistribution ?? {};
    const facets: Facets = {
      genres: toFacet(dist.genreSlugs),
      instruments: toFacet(dist.instrumentSlugs),
      topics: toFacet(dist.topicSlugs),
      types: toFacet(dist.type),
      difficulties: toDifficultyFacet(dist.difficulty),
    };

    return {
      items: hits.map((hit) => ({
        slug: hit.slug,
        title: hit.title,
        summary: hit.summary ?? undefined,
        type: hit.type,
        difficulty: hit.difficulty ?? undefined,
        visibility: hit.visibility,
        genres: hit.genres,
        instruments: hit.instruments,
        topics: hit.topics,
      })),
      facets,
      total: result.estimatedTotalHits ?? result.hits.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}

function toIndexDoc(item: ContentItem): IndexDoc {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    type: item.type,
    difficulty: item.difficulty,
    visibility: item.visibility,
    genreSlugs: item.genres.map((g) => g.slug),
    instrumentSlugs: item.instruments.map((i) => i.slug),
    topicSlugs: item.topics.map((t) => t.slug),
    genres: item.genres,
    instruments: item.instruments,
    topics: item.topics,
  };
}

function toFacet(distribution: Record<string, number> | undefined): FacetValue[] {
  if (!distribution) {
    return [];
  }
  return Object.entries(distribution)
    .map(([value, count]) => ({ value, label: slugToLabel(value), count }))
    .sort((a, b) => b.count - a.count);
}

function toDifficultyFacet(distribution: Record<string, number> | undefined): FacetValue[] {
  if (!distribution) {
    return [];
  }
  return Object.entries(distribution)
    .map(([value, count]) => ({ value, label: `Grade ${value}`, count }))
    .sort((a, b) => Number(a.value) - Number(b.value));
}
