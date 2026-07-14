import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/application/current-user';
import { ResolveOptionalAuth } from '../auth/require-permissions.decorator';
import { RecordCollectionOpenUseCase } from './application/use-cases/collection-engagement.use-case';
import { GetCollectionBySlugUseCase } from './application/use-cases/get-collection.use-case';
import { GetCollectionWithProgressUseCase } from './application/use-cases/get-collection-progress.use-case';
import {
  ListCollectionsForContentUseCase,
  ListCollectionsUseCase,
} from './application/use-cases/list-collections.use-case';
import { SearchCollectionsUseCase } from './application/use-cases/search-collections.use-case';
import { type CollectionSearchQuery, parseCollectionSort } from './domain/collection-search';

type RawQuery = Record<string, string | string[] | undefined>;

/** Public read path for collections (published only). Progress/open resolve the optional viewer. */
@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly listCollections: ListCollectionsUseCase,
    private readonly searchCollections: SearchCollectionsUseCase,
    private readonly getCollection: GetCollectionBySlugUseCase,
    private readonly getWithProgress: GetCollectionWithProgressUseCase,
    private readonly recordOpen: RecordCollectionOpenUseCase,
    private readonly listForContent: ListCollectionsForContentUseCase,
    private readonly currentUser: CurrentUser,
  ) {}

  @Get()
  async list() {
    return { items: await this.listCollections.execute() };
  }

  @Get('search')
  search(@Query() query: RawQuery) {
    return this.searchCollections.execute(normalizeQuery(query));
  }

  @Get('by-content/:slug')
  async byContent(@Param('slug') slug: string) {
    return { items: await this.listForContent.execute(slug) };
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.getCollection.execute(slug);
  }

  @Get(':slug/progress')
  @ResolveOptionalAuth()
  progress(@Param('slug') slug: string) {
    return this.getWithProgress.execute(slug, this.currentUser.optional()?.id ?? null);
  }

  @Post(':slug/open')
  @HttpCode(204)
  open(@Param('slug') slug: string) {
    return this.recordOpen.execute(slug);
  }
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  // Drop empties — the FE serializes unselected array facets as `era=` (empty string).
  return (Array.isArray(value) ? value : [value]).filter((entry) => entry !== '');
}

function toInt(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeQuery(query: RawQuery): CollectionSearchQuery {
  const difficultyRaw = toInt(query.difficulty, Number.NaN);
  return {
    q: typeof query.q === 'string' ? query.q : undefined,
    kind: typeof query.kind === 'string' && query.kind !== '' ? query.kind : undefined,
    eras: toArray(query.era),
    instruments: toArray(query.instrument),
    techniques: toArray(query.technique),
    moods: toArray(query.mood),
    curators: toArray(query.curator),
    difficulty: Number.isFinite(difficultyRaw) ? difficultyRaw : undefined,
    featured: query.featured === 'true' ? true : undefined,
    sort: parseCollectionSort(typeof query.sort === 'string' ? query.sort : undefined),
    page: Math.max(1, toInt(query.page, 1)),
    pageSize: Math.min(100, Math.max(1, toInt(query.pageSize, 24))),
  };
}
