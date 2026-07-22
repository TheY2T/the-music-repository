import { Controller, Get, Header, Param, Req, Res } from '@nestjs/common';
import { CACHE_PUBLIC_MEDIUM } from '../http/cache-control';
import { FeatureFlagCatalogue } from './application/ports/feature-flag-catalogue.port';

/** Structural request/response shapes (avoids an express import). */
interface ConditionalRequest {
  headers: Record<string, string | string[] | undefined>;
}
interface CacheableResponse {
  status(code: number): unknown;
  setHeader(name: string, value: string): unknown;
}

/**
 * Public feature-flag read path (ADR 0035). Serves the evaluatable per-environment snapshot the web SSR
 * provider (`@TheY2T/tmr-flags-eval` `HttpSnapshotSource`) loads per request. Ungated. The per-environment
 * ETag lets the web layer skip re-downloading an unchanged snapshot (conditional GET → 304).
 */
@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly catalogue: FeatureFlagCatalogue) {}

  @Get('environments')
  @Header('Cache-Control', CACHE_PUBLIC_MEDIUM)
  async environments() {
    return { items: await this.catalogue.environments() };
  }

  @Get('snapshot/:env')
  async snapshot(
    @Param('env') env: string,
    @Req() req: ConditionalRequest,
    @Res({ passthrough: true }) res: CacheableResponse,
  ) {
    const snapshot = await this.catalogue.snapshot(env);
    const etag = `"${snapshot.version}"`;
    res.setHeader('ETag', etag);
    // Browsers revalidate every time (max-age=0, ETag → cheap 304); the edge may serve a snapshot for a
    // short window and refresh in the background, so a flag toggle propagates within ~a minute.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
    if (req.headers['if-none-match'] === etag) {
      res.status(304);
      return undefined;
    }
    return snapshot;
  }
}
