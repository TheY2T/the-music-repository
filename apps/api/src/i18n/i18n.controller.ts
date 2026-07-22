import { Controller, Get, Header, Param, Req, Res } from '@nestjs/common';
import { CACHE_PUBLIC_MEDIUM } from '../http/cache-control';
import {
  GetLocaleCatalogueUseCase,
  GetLocalesUseCase,
  GetLocaleVersionsUseCase,
} from './application/ui-message.use-cases';

/** Just the request/response surface this controller touches (structural — avoids an express import). */
interface ConditionalRequest {
  headers: Record<string, string | string[] | undefined>;
}
interface CacheableResponse {
  status(code: number): unknown;
  setHeader(name: string, value: string): unknown;
}

/**
 * Public localization read path (ADR 0034). Serves the DB-backed published catalogue that `apps/web`
 * loads per request. Ungated — it is the site's baseline string source. The per-locale ETag lets the
 * web layer (and browsers) skip re-downloading an unchanged catalogue.
 */
@Controller('i18n')
export class I18nController {
  constructor(
    private readonly getVersions: GetLocaleVersionsUseCase,
    private readonly getCatalogue: GetLocaleCatalogueUseCase,
    private readonly getLocales: GetLocalesUseCase,
  ) {}

  @Get('version')
  @Header('Cache-Control', CACHE_PUBLIC_MEDIUM)
  async versions() {
    return { versions: await this.getVersions.execute() };
  }

  @Get('locales')
  @Header('Cache-Control', CACHE_PUBLIC_MEDIUM)
  async locales() {
    return { items: await this.getLocales.execute() };
  }

  @Get('catalogue/:locale')
  async catalogue(
    @Param('locale') locale: string,
    @Req() req: ConditionalRequest,
    @Res({ passthrough: true }) res: CacheableResponse,
  ) {
    const snapshot = await this.getCatalogue.execute(locale);
    const etag = `"${snapshot.version}"`;
    res.setHeader('ETag', etag);
    // Browsers revalidate every time (max-age=0, ETag → cheap 304); the edge may serve the catalogue for
    // a short window and refresh in the background, so a published string change propagates within ~a minute.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
    if (req.headers['if-none-match'] === etag) {
      res.status(304);
      return undefined;
    }
    return snapshot;
  }
}
