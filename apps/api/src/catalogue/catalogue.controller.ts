import { FlagDefaults, FlagKeys } from '@TheY2T/tmr-flags';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { OpenFeatureClient } from '@openfeature/nestjs-sdk';
import type { Client } from '@openfeature/server-sdk';
import { ResolveOptionalAuth } from '../auth/require-permissions.decorator';
import { PremiumAccessService } from '../entitlements/application/premium-access.service';
import { GetContentBySlugUseCase } from './application/use-cases/get-content-by-slug.use-case';
import { GetRelatedContentUseCase } from './application/use-cases/get-related-content.use-case';
import { SearchCatalogueUseCase } from './application/use-cases/search-catalogue.use-case';
import { type CatalogueQuery, entitledRank } from './domain/content-item';

type RawQuery = Record<string, string | string[] | undefined>;

@Controller('catalogue')
export class CatalogueController {
  constructor(
    private readonly searchCatalogue: SearchCatalogueUseCase,
    private readonly getContent: GetContentBySlugUseCase,
    private readonly getRelated: GetRelatedContentUseCase,
    private readonly premiumAccess: PremiumAccessService,
    @OpenFeatureClient() private readonly flags: Client,
  ) {}

  /** The viewer's premium **tier rank** — how high their plan reaches. Infinity when gating is flagged
   * off or the viewer is staff; else the max rank among their active entitlement keys (0 = none). */
  private async resolveViewerRank(): Promise<number> {
    const gatingOn = await this.flags.getBooleanValue(
      FlagKeys.Premium,
      FlagDefaults[FlagKeys.Premium],
    );
    if (!gatingOn) {
      return Number.POSITIVE_INFINITY;
    }
    const { staff, keys } = await this.premiumAccess.viewerEntitlement();
    return staff ? Number.POSITIVE_INFINITY : entitledRank(keys);
  }

  @Get('items')
  @ResolveOptionalAuth()
  async search(@Query() query: RawQuery) {
    return this.searchCatalogue.execute(normalizeQuery(query), await this.resolveViewerRank());
  }

  @Get('items/:slug')
  @ResolveOptionalAuth()
  async detail(@Param('slug') slug: string) {
    return this.getContent.execute(slug, await this.resolveViewerRank());
  }

  @Get('items/:slug/related')
  async related(@Param('slug') slug: string) {
    return { items: await this.getRelated.execute(slug) };
  }
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  // Drop empties — the FE serializes unselected array facets as `genre=` (empty string).
  return (Array.isArray(value) ? value : [value]).filter((entry) => entry !== '');
}

function toInt(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw != null ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeQuery(query: RawQuery): CatalogueQuery {
  const difficultyRaw = toInt(query.difficulty, Number.NaN);
  return {
    q: typeof query.q === 'string' ? query.q : undefined,
    genres: toArray(query.genre),
    instruments: toArray(query.instrument),
    topics: toArray(query.topic),
    type: typeof query.type === 'string' ? query.type : undefined,
    difficulty: Number.isFinite(difficultyRaw) ? difficultyRaw : undefined,
    page: Math.max(1, toInt(query.page, 1)),
    pageSize: Math.min(100, Math.max(1, toInt(query.pageSize, 20))),
  };
}
